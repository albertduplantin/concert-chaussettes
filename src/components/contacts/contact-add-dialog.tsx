"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactAddDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", nom: "", telephone: "" });
  const [errors, setErrors] = useState<{ email?: string }>({});

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "email") setErrors({});
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) return { email: "L'email est requis" };
    if (!emailRegex.test(form.email.trim())) return { email: "Email invalide" };
    return {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/organisateur/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: [{
            email: form.email.trim(),
            nom: form.nom.trim() || undefined,
            telephone: form.telephone.trim() || undefined,
          }],
          source: "manuel",
          sourceLabel: "Ajout manuel",
          onDuplicate: "update",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      if (data.updated > 0) {
        toast.success("Contact mis à jour.");
      } else {
        toast.success("Contact ajouté !");
      }
      setForm({ email: "", nom: "", telephone: "" });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter un contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="jean@exemple.fr"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              autoFocus
              className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              type="text"
              placeholder="Jean Dupont"
              value={form.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={form.telephone}
              onChange={(e) => handleChange("telephone", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
