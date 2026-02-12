"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { GroupeSelect } from "@/components/forms/groupe-select";

function NewConcertForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGroupeId = searchParams.get("groupeId");

  const [isLoading, setIsLoading] = useState(false);
  const [showGroupe, setShowGroupe] = useState(true);
  const [selectedGroupeId, setSelectedGroupeId] = useState<string | null>(initialGroupeId);

  async function handleSubmit(status: "BROUILLON" | "PUBLIE") {
    setIsLoading(true);

    const form = document.getElementById("concert-form") as HTMLFormElement;
    const formData = new FormData(form);

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
      groupeId: selectedGroupeId,
      status,
    };

    try {
      const res = await fetch("/api/concerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || data.error || "Erreur lors de la création");
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

      <form id="concert-form" onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                placeholder="Ex: Soirée jazz dans mon salon"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décrivez votre concert, l'ambiance, ce que les invités peuvent attendre..."
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
            <CardTitle>Groupe</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupeSelect
              value={selectedGroupeId}
              onChange={(id) => setSelectedGroupeId(id)}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Optionnel : associez un groupe à ce concert pour afficher ses informations sur la page publique.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lieu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adresseComplete">
                Adresse complète (visible uniquement par les inscrits confirmés)
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
                  Adresse publique (affichée sur la page)
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
                Nombre maximum d&apos;invités (laisser vide si pas de limite)
              </Label>
              <Input
                id="maxInvites"
                name="maxInvites"
                type="number"
                min={1}
                placeholder="20"
              />
            </div>
            {selectedGroupeId && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Afficher le groupe sur la page publique</Label>
                  <p className="text-sm text-muted-foreground">
                    Les informations du groupe seront visibles par les invités
                  </p>
                </div>
                <Switch
                  checked={showGroupe}
                  onCheckedChange={setShowGroupe}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="gap-2"
            onClick={() => handleSubmit("BROUILLON")}
          >
            <Save className="h-4 w-4" />
            Sauvegarder comme brouillon
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className="gap-2"
            onClick={() => handleSubmit("PUBLIE")}
          >
            Publier le concert
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewConcertPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <NewConcertForm />
    </Suspense>
  );
}
