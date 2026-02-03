"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ThumbnailUploader } from "@/components/ui/thumbnail-uploader";
import { toast } from "sonner";
import { Loader2, Save, MapPin, Sparkles, Camera } from "lucide-react";

interface OrganisateurProfileFormProps {
  organisateur: {
    id: string;
    nom: string;
    bio: string | null;
    thumbnailUrl: string | null;
    ville: string | null;
    codePostal: string | null;
    departement: string | null;
    region: string | null;
  };
}

export function OrganisateurProfileForm({ organisateur }: OrganisateurProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [nom, setNom] = useState(organisateur.nom);
  const [bio, setBio] = useState(organisateur.bio || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(organisateur.thumbnailUrl);
  const [ville, setVille] = useState(organisateur.ville || "");
  const [codePostal, setCodePostal] = useState(organisateur.codePostal || "");
  const [departement, setDepartement] = useState(organisateur.departement || "");
  const [region, setRegion] = useState(organisateur.region || "");

  function handleCitySelect(city: {
    ville: string;
    codePostal: string;
    departement: string;
    region: string;
  }) {
    setVille(city.ville);
    setCodePostal(city.codePostal);
    setDepartement(city.departement);
    setRegion(city.region);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const emptyToNull = (val: string) => val.trim() === "" ? null : val;

      const res = await fetch("/api/organisateur/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom || "Organisateur",
          bio: emptyToNull(bio),
          thumbnailUrl: thumbnailUrl,
          ville: emptyToNull(ville),
          codePostal: emptyToNull(codePostal),
          departement: emptyToNull(departement),
          region: emptyToNull(region),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.error?.message || data.error || "Erreur lors de la sauvegarde";
        toast.error(typeof errorMessage === "string" ? errorMessage : "Erreur lors de la sauvegarde");
        return;
      }

      toast.success("Profil mis à jour avec succès !");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo de profil */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">Photo de profil</Label>
        </div>
        <ThumbnailUploader
          thumbnailUrl={thumbnailUrl}
          onThumbnailChange={setThumbnailUrl}
          endpoint="organisateurThumbnail"
          disabled={isLoading}
        />
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="nom">
          Votre nom ou pseudo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Jean Dupont"
          required
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground">
          Ce nom sera visible par les groupes que vous contactez.
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Présentation (optionnel)</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Quelques mots sur vous ou vos événements..."
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {bio.length}/2000 caractères
        </p>
      </div>

      {/* Localisation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">Localisation</Label>
        </div>

        {/* City autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="ville">
            Ville
            <span className="ml-2 text-xs text-muted-foreground font-normal inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-orange-500" />
              Autocomplétion
            </span>
          </Label>
          <CityAutocomplete
            value={ville}
            onChange={setVille}
            onSelect={handleCitySelect}
            placeholder="Rechercher une ville..."
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Sélectionnez une ville pour remplir automatiquement les autres champs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codePostal">Code postal</Label>
            <Input
              id="codePostal"
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              placeholder="75001"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departement">Département</Label>
            <Input
              id="departement"
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              placeholder="Paris"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Région</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Île-de-France"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
