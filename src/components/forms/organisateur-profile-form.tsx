"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ThumbnailUploader } from "@/components/ui/thumbnail-uploader";
import { ImageUploader } from "@/components/ui/image-uploader";
import { toast } from "sonner";
import { Loader2, Save, MapPin, Sparkles, Camera, Eye, EyeOff, Users, Plug, X } from "lucide-react";

interface OrganisateurProfileFormProps {
  organisateur: {
    id: string;
    nom: string;
    bio: string | null;
    thumbnailUrl: string | null;
    photos: string[] | null;
    capaciteMax: number | null;
    equipements: string[] | null;
    isVisible: boolean;
    ville: string | null;
    codePostal: string | null;
    departement: string | null;
    region: string | null;
  };
}

const EQUIPEMENT_SUGGESTIONS = ["Sonorisation", "Piano", "Micro", "Parking", "Accès PMR", "Chauffage/clim"];

export function OrganisateurProfileForm({ organisateur }: OrganisateurProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [nom, setNom] = useState(organisateur.nom);
  const [bio, setBio] = useState(organisateur.bio || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(organisateur.thumbnailUrl);
  const [photos, setPhotos] = useState<string[]>(organisateur.photos || []);
  const [capaciteMax, setCapaciteMax] = useState(organisateur.capaciteMax?.toString() || "");
  const [equipements, setEquipements] = useState<string[]>(organisateur.equipements || []);
  const [equipementInput, setEquipementInput] = useState("");
  const [isVisible, setIsVisible] = useState(organisateur.isVisible);
  const [ville, setVille] = useState(organisateur.ville || "");
  const [codePostal, setCodePostal] = useState(organisateur.codePostal || "");
  const [departement, setDepartement] = useState(organisateur.departement || "");
  const [region, setRegion] = useState(organisateur.region || "");

  function addEquipement(value: string) {
    const trimmed = value.trim();
    if (!trimmed || equipements.includes(trimmed) || equipements.length >= 15) return;
    setEquipements([...equipements, trimmed]);
    setEquipementInput("");
  }

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
          photos,
          capaciteMax: capaciteMax ? parseInt(capaciteMax, 10) : null,
          equipements,
          isVisible,
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

      {/* Galerie du lieu */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">Photos du lieu</Label>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Montrez votre salon ou votre espace aux groupes : ambiance, disposition, jauge réelle.
        </p>
        <ImageUploader
          images={photos}
          onImagesChange={setPhotos}
          maxImages={10}
          endpoint="organisateurPhoto"
          disabled={isLoading}
        />
      </div>

      {/* Jauge et équipements */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="capaciteMax" className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Jauge maximum (optionnel)
          </Label>
          <Input
            id="capaciteMax"
            type="number"
            min={1}
            max={2000}
            value={capaciteMax}
            onChange={(e) => setCapaciteMax(e.target.value)}
            placeholder="30"
          />
          <p className="text-xs text-muted-foreground">
            Nombre de personnes que votre lieu peut accueillir.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipements" className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-muted-foreground" />
            Équipements disponibles (optionnel)
          </Label>
          <div className="flex gap-2">
            <Input
              id="equipements"
              value={equipementInput}
              onChange={(e) => setEquipementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEquipement(equipementInput);
                }
              }}
              placeholder="Sonorisation..."
              maxLength={50}
            />
            <Button type="button" variant="outline" onClick={() => addEquipement(equipementInput)}>
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPEMENT_SUGGESTIONS.filter((s) => !equipements.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addEquipement(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
          {equipements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {equipements.map((eq) => (
                <Badge key={eq} variant="secondary" className="gap-1 pr-1.5">
                  {eq}
                  <button
                    type="button"
                    onClick={() => setEquipements(equipements.filter((e) => e !== eq))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visibilité publique */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center gap-3">
          {isVisible ? (
            <Eye className="h-5 w-5 text-green-600" />
          ) : (
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-sm">Profil visible par les groupes</p>
            <p className="text-xs text-muted-foreground">
              {isVisible
                ? "Les groupes peuvent vous trouver dans la recherche et vous contacter."
                : "Votre profil est masqué : vous n'apparaissez pas dans la recherche."}
            </p>
          </div>
        </div>
        <Switch checked={isVisible} onCheckedChange={setIsVisible} disabled={isLoading} />
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
