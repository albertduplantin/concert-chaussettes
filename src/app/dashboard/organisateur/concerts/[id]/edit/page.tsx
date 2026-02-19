"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Trash2, Loader2 } from "lucide-react";
import { use } from "react";
import { GroupeSelect } from "@/components/forms/groupe-select";

interface EditConcertPageProps {
  params: Promise<{ id: string }>;
}

interface Groupe {
  id: string;
  nom: string;
  bio: string | null;
  ville: string | null;
  region: string | null;
  genres: { id: string; nom: string }[];
}

interface Concert {
  id: string;
  titre: string;
  description: string | null;
  date: string;
  adresseComplete: string | null;
  adressePublique: string | null;
  ville: string | null;
  maxInvites: number | null;
  showGroupe: boolean;
  status: "BROUILLON" | "PUBLIE" | "ANNULE";
  groupeId: string | null;
  groupe?: Groupe | null;
  customBranding?: { primaryColor?: string; logo?: string } | null;
}

export default function EditConcertPage({ params }: EditConcertPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showGroupe, setShowGroupe] = useState(true);
  const [concert, setConcert] = useState<Concert | null>(null);
  const [selectedGroupeId, setSelectedGroupeId] = useState<string | null>(null);
  const [initialGroupe, setInitialGroupe] = useState<Groupe | null>(null);
  const [accentColor, setAccentColor] = useState("#f97316");

  useEffect(() => {
    async function fetchConcert() {
      try {
        const res = await fetch(`/api/concerts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setConcert(data.concert);
          setShowGroupe(data.concert.showGroupe);
          setSelectedGroupeId(data.concert.groupeId);
          if (data.concert.groupe) {
            setInitialGroupe(data.concert.groupe);
          }
          if (data.concert.customBranding?.primaryColor) {
            setAccentColor(data.concert.customBranding.primaryColor);
          }
        } else {
          toast.error("Concert non trouvé");
          router.push("/dashboard/organisateur/concerts");
        }
      } catch {
        toast.error("Erreur lors du chargement");
      } finally {
        setIsFetching(false);
      }
    }
    fetchConcert();
  }, [id, router]);

  async function handleSubmit(status: "BROUILLON" | "PUBLIE") {
    if (!concert) return;
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
      customBranding: { primaryColor: accentColor },
    };

    try {
      const res = await fetch(`/api/concerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || data.error || "Erreur lors de la mise à jour");
        return;
      }

      toast.success(status === "PUBLIE" ? "Concert publié !" : "Concert mis à jour !");
      router.push("/dashboard/organisateur/concerts");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce concert ?")) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/concerts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Concert supprimé");
        router.push("/dashboard/organisateur/concerts");
        router.refresh();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!concert) {
    return null;
  }

  // Formatter la date pour le champ datetime-local
  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/organisateur/concerts">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Modifier le concert</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Supprimer
        </Button>
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
                defaultValue={concert.titre}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={concert.description || ""}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date et heure</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={formatDateForInput(concert.date)}
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
              initialGroupe={initialGroupe}
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
                defaultValue={concert.adresseComplete || ""}
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
                  defaultValue={concert.adressePublique || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  name="ville"
                  defaultValue={concert.ville || ""}
                />
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
                defaultValue={concert.maxInvites || ""}
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

        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accentColor">Couleur d&apos;accent de la page concert</Label>
              <div className="flex items-center gap-3">
                <input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-16 rounded cursor-pointer border border-input"
                />
                <span className="text-sm text-muted-foreground">
                  Personnalise la couleur des boutons et badges sur la page publique du concert.
                </span>
              </div>
              <div
                className="mt-2 h-8 rounded-lg text-white text-xs flex items-center justify-center font-medium"
                style={{ backgroundColor: accentColor }}
              >
                Aperçu de la couleur
              </div>
            </div>
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
            Sauvegarder
          </Button>
          {concert.status !== "PUBLIE" && (
            <Button
              type="button"
              disabled={isLoading}
              className="gap-2"
              onClick={() => handleSubmit("PUBLIE")}
            >
              <Send className="h-4 w-4" />
              Publier le concert
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
