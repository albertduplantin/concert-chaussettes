"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function NewConcertPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showGroupe, setShowGroupe] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const body = {
      titre: formData.get("titre") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      adresseComplete: formData.get("adresseComplete") as string,
      adressePublique: formData.get("adressePublique") as string,
      ville: formData.get("ville") as string,
      maxInvites: formData.get("maxInvites")
        ? Number(formData.get("maxInvites"))
        : null,
      showGroupe,
      status: formData.get("status") as "BROUILLON" | "PUBLIE",
    };

    try {
      const res = await fetch("/api/concerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création");
        return;
      }

      toast.success("Concert créé !");
      router.push("/dashboard/organisateur/concerts");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/organisateur/concerts">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Nouveau concert</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du concert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du concert</Label>
              <Input
                id="titre"
                name="titre"
                placeholder="Ex: Soir&eacute;e jazz dans mon salon"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="D&eacute;crivez votre concert, l'ambiance, ce que les invit&eacute;s peuvent attendre..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date et heure</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lieu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adresseComplete">
                Adresse compl&egrave;te (visible uniquement par les inscrits confirm&eacute;s)
              </Label>
              <Input
                id="adresseComplete"
                name="adresseComplete"
                placeholder="12 rue de la Musique, 75001 Paris"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adressePublique">
                  Adresse publique (affich&eacute;e sur la page)
                </Label>
                <Input
                  id="adressePublique"
                  name="adressePublique"
                  placeholder="Quartier Montmartre, Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" name="ville" placeholder="Paris" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxInvites">
                Nombre maximum d&apos;invit&eacute;s (laisser vide si pas de limite)
              </Label>
              <Input
                id="maxInvites"
                name="maxInvites"
                type="number"
                min={1}
                placeholder="20"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Afficher le groupe sur la page publique</Label>
                <p className="text-sm text-muted-foreground">
                  Les informations du groupe seront visibles par les invit&eacute;s
                </p>
              </div>
              <Switch
                checked={showGroupe}
                onCheckedChange={setShowGroupe}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            name="status"
            value="BROUILLON"
            variant="outline"
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Sauvegarder comme brouillon
          </Button>
          <Button
            type="submit"
            name="status"
            value="PUBLIE"
            disabled={isLoading}
            className="gap-2"
          >
            Publier le concert
          </Button>
        </div>
      </form>
    </div>
  );
}
