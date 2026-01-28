"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Mail, MessageSquare, Phone, Copy, Trash2 } from "lucide-react";

interface Template {
  id: string;
  nom: string;
  sujet: string | null;
  contenu: string;
  type: "EMAIL" | "SMS" | "WHATSAPP";
  isDefault: boolean;
}

interface MessageTemplatesListProps {
  templates: Template[];
  systemTemplates: Template[];
  isPremium: boolean;
  organisateurId: string;
}

const typeIcons = {
  EMAIL: Mail,
  SMS: Phone,
  WHATSAPP: MessageSquare,
};

const typeLabels = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

export function MessageTemplatesList({
  templates,
  systemTemplates,
  isPremium,
  organisateurId,
}: MessageTemplatesListProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<"EMAIL" | "SMS" | "WHATSAPP">("EMAIL");

  const maxTemplates = isPremium ? Infinity : 2;
  const canCreate = templates.length < maxTemplates;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/messages/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.get("nom"),
          sujet: formData.get("sujet") || null,
          contenu: formData.get("contenu"),
          type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la création");
        return;
      }

      toast.success("Template créé !");
      setIsOpen(false);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers !");
  }

  const allTemplates = [...systemTemplates, ...templates];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Variables disponibles : {"{{nom}}"}, {"{{concert}}"}, {"{{date}}"},{"{{lieu}}"}, {"{{lien}}"}
        </p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cr&eacute;er un template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du template</Label>
                <Input
                  id="nom"
                  name="nom"
                  placeholder="Ex: Invitation concert"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    setType(v as "EMAIL" | "SMS" | "WHATSAPP")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === "EMAIL" && (
                <div className="space-y-2">
                  <Label htmlFor="sujet">Sujet</Label>
                  <Input
                    id="sujet"
                    name="sujet"
                    placeholder="Vous &ecirc;tes invit&eacute;(e) &agrave; un concert priv&eacute; !"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="contenu">Contenu</Label>
                <Textarea
                  id="contenu"
                  name="contenu"
                  placeholder={`Bonjour {{nom}},\n\nVous êtes invité(e) au concert "{{concert}}" le {{date}} à {{lieu}}.\n\nInscrivez-vous ici : {{lien}}\n\nÀ bientôt !`}
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Cr\u00e9ation..." : "Cr\u00e9er le template"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!canCreate && !isPremium && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <p className="text-sm text-orange-800">
              Vous avez atteint la limite de {maxTemplates} templates. Passez en
              Premium pour en cr&eacute;er davantage.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {allTemplates.map((template) => {
          const Icon = typeIcons[template.type];
          return (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {template.nom}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {typeLabels[template.type]}
                    </Badge>
                    {template.isDefault && (
                      <Badge variant="secondary">Syst&egrave;me</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.sujet && (
                  <p className="text-sm font-medium">
                    Sujet : {template.sujet}
                  </p>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {template.contenu}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => copyToClipboard(template.contenu)}
                >
                  <Copy className="h-3 w-3" />
                  Copier le contenu
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allTemplates.length === 0 && (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Aucun template cr&eacute;&eacute;. Cr&eacute;ez-en un pour faciliter vos invitations.
          </p>
        </Card>
      )}
    </div>
  );
}
