"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, Phone, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Template {
  id: string;
  nom: string;
  sujet: string | null;
  contenu: string;
  type: "EMAIL" | "SMS" | "WHATSAPP";
}

interface Concert {
  id: string;
  titre: string;
  description: string | null;
  date: string;
  adresseComplete: string | null;
  adressePublique: string | null;
  ville: string | null;
  slug: string;
}

interface MessageGeneratorProps {
  concert: Concert;
  organisateurNom: string;
}

export function MessageGenerator({ concert, organisateurNom }: MessageGeneratorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<"EMAIL" | "SMS" | "WHATSAPP">("EMAIL");
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Charger les templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/messages/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates);
        }
      } catch {
        console.error("Erreur chargement templates");
      }
    }
    fetchTemplates();
  }, []);

  // Filtrer les templates par type
  const filteredTemplates = templates.filter((t) => t.type === activeTab);

  // Générer le message
  function generateMessage(template: Template) {
    const date = new Date(concert.date);
    const dateStr = format(date, "d MMMM yyyy", { locale: fr });
    const heureStr = format(date, "HH:mm", { locale: fr });
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const replacements: Record<string, string> = {
      "{{titre_concert}}": concert.titre,
      "{{date_concert}}": dateStr,
      "{{heure_concert}}": heureStr,
      "{{ville_concert}}": concert.ville || "À définir",
      "{{adresse_complete}}": concert.adresseComplete || concert.adressePublique || "À définir",
      "{{description_concert}}": concert.description || "",
      "{{lien_inscription}}": `${baseUrl}/concert/${concert.slug}`,
      "{{nom_organisateur}}": organisateurNom,
      "{{prenom}}": recipientName || "[Prénom]",
    };

    let message = template.contenu;
    let subject = template.sujet || "";

    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
      subject = subject.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });

    setGeneratedMessage(message);
    setGeneratedSubject(subject);
    setSelectedTemplate(template);
  }

  // Copier dans le presse-papier
  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copié !");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  }

  // Ouvrir le client mail
  function openMailClient() {
    const mailto = `mailto:?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(generatedMessage)}`;
    window.open(mailto);
  }

  // Ouvrir WhatsApp
  function openWhatsApp() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(generatedMessage)}`;
    window.open(waUrl, "_blank");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Préparer les messages d&apos;invitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="EMAIL" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="SMS" className="gap-2">
              <Phone className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="WHATSAPP" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Sélection du template */}
            <div className="space-y-2">
              <Label>Choisir un template</Label>
              <Select
                onValueChange={(id) => {
                  const template = templates.find((t) => t.id === id);
                  if (template) generateMessage(template);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nom}
                      {template.id.startsWith("default") && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Défaut
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prénom du destinataire */}
            <div className="space-y-2">
              <Label htmlFor="recipientName">Prénom du destinataire (optionnel)</Label>
              <Input
                id="recipientName"
                placeholder="Ex: Marie"
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  if (selectedTemplate) generateMessage(selectedTemplate);
                }}
              />
            </div>

            {selectedTemplate && (
              <>
                {/* Sujet (email uniquement) */}
                {activeTab === "EMAIL" && generatedSubject && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sujet</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedSubject, "subject")}
                        className="gap-1 h-8"
                      >
                        {copiedField === "subject" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copier
                      </Button>
                    </div>
                    <Input value={generatedSubject} readOnly className="bg-muted" />
                  </div>
                )}

                {/* Message généré */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedMessage, "message")}
                      className="gap-1 h-8"
                    >
                      {copiedField === "message" ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copier
                    </Button>
                  </div>
                  <Textarea
                    value={generatedMessage}
                    readOnly
                    rows={10}
                    className="bg-muted font-mono text-sm"
                  />
                </div>

                {/* Actions rapides */}
                <div className="flex gap-2 pt-2">
                  {activeTab === "EMAIL" && (
                    <Button onClick={openMailClient} variant="outline" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Ouvrir dans Mail
                    </Button>
                  )}
                  {activeTab === "WHATSAPP" && (
                    <Button onClick={openWhatsApp} variant="outline" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Ouvrir WhatsApp
                    </Button>
                  )}
                  <Button
                    onClick={() => copyToClipboard(generatedMessage, "message")}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copier le message
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
