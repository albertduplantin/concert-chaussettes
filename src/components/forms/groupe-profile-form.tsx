"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/ui/image-uploader";
import { toast } from "sonner";
import { X, Plus, Youtube, Save, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupeProfileFormProps {
  groupe: {
    id: string;
    nom: string;
    bio: string | null;
    photos: string[];
    thumbnailUrl: string | null;
    youtubeVideos: string[];
    ville: string | null;
    codePostal: string | null;
    departement: string | null;
    region: string | null;
    contactEmail: string | null;
    contactTel: string | null;
    contactSite: string | null;
    genres: string[];
  };
  allGenres: { id: string; nom: string; isCustom: boolean }[];
  isPremium: boolean;
}

export function GroupeProfileForm({
  groupe,
  allGenres,
  isPremium,
}: GroupeProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [nom, setNom] = useState(groupe.nom);
  const [bio, setBio] = useState(groupe.bio || "");
  const [ville, setVille] = useState(groupe.ville || "");
  const [codePostal, setCodePostal] = useState(groupe.codePostal || "");
  const [departement, setDepartement] = useState(groupe.departement || "");
  const [region, setRegion] = useState(groupe.region || "");
  const [contactEmail, setContactEmail] = useState(groupe.contactEmail || "");
  const [contactTel, setContactTel] = useState(groupe.contactTel || "");
  const [contactSite, setContactSite] = useState(groupe.contactSite || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    groupe.genres
  );
  const [photos, setPhotos] = useState<string[]>(groupe.photos || []);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    groupe.thumbnailUrl
  );
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>(
    groupe.youtubeVideos
  );
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const maxVideos = isPremium ? 5 : 3;
  const maxPhotos = isPremium ? 10 : 3;

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  }

  function extractYoutubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function addVideo() {
    if (youtubeVideos.length >= maxVideos) {
      toast.error(
        isPremium
          ? "Maximum 5 vidéos"
          : "Passez en Premium pour ajouter plus de vidéos"
      );
      return;
    }
    const videoId = extractYoutubeId(newVideoUrl);
    if (!videoId) {
      toast.error("URL YouTube invalide");
      return;
    }
    if (youtubeVideos.includes(videoId)) {
      toast.error("Cette vidéo est déjà ajoutée");
      return;
    }
    setYoutubeVideos((prev) => [...prev, videoId]);
    setNewVideoUrl("");
  }

  function removeVideo(videoId: string) {
    setYoutubeVideos((prev) => prev.filter((id) => id !== videoId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/groupe/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          bio,
          ville,
          codePostal,
          departement,
          region,
          contactEmail,
          contactTel,
          contactSite,
          genres: selectedGenres,
          photos,
          thumbnailUrl,
          youtubeVideos,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la sauvegarde");
        return;
      }

      toast.success("Profil mis à jour !");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations g&eacute;n&eacute;rales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du groupe</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Pr&eacute;sentation</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Pr&eacute;sentez votre groupe, votre style, votre histoire..."
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Genres musicaux */}
      <Card>
        <CardHeader>
          <CardTitle>Genres musicaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((genre) => (
              <Badge
                key={genre.id}
                variant={
                  selectedGenres.includes(genre.id) ? "default" : "outline"
                }
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedGenres.includes(genre.id) &&
                    "bg-primary text-primary-foreground"
                )}
                onClick={() => toggleGenre(genre.id)}
              >
                {genre.nom}
              </Badge>
            ))}
          </div>
          {allGenres.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun genre disponible pour le moment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos
            <span className="text-sm font-normal text-muted-foreground">
              ({photos.length}/{maxPhotos})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            images={photos}
            onImagesChange={setPhotos}
            maxImages={maxPhotos}
            thumbnailUrl={thumbnailUrl}
            onThumbnailChange={setThumbnailUrl}
            disabled={isLoading}
          />
          {!isPremium && photos.length >= maxPhotos && (
            <p className="text-sm text-muted-foreground mt-4">
              Passez en Premium pour ajouter jusqu&apos;&agrave; 10 photos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Localisation */}
      <Card>
        <CardHeader>
          <CardTitle>Localisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codePostal">Code postal</Label>
              <Input
                id="codePostal"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="75001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departement">D&eacute;partement</Label>
              <Input
                id="departement"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">R&eacute;gion</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="&Icirc;le-de-France"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vidéos YouTube */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            Vid&eacute;os YouTube
            <span className="text-sm font-normal text-muted-foreground">
              ({youtubeVideos.length}/{maxVideos})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vidéos existantes */}
          {youtubeVideos.map((videoId) => (
            <div key={videoId} className="relative">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => removeVideo(videoId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Ajout vidéo */}
          {youtubeVideos.length < maxVideos && (
            <div className="flex gap-2">
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button type="button" variant="outline" onClick={addVideo}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          )}

          {!isPremium && youtubeVideos.length >= maxVideos && (
            <p className="text-sm text-muted-foreground">
              Passez en Premium pour ajouter jusqu&apos;&agrave; 5 vid&eacute;os.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email de contact</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@mongroupe.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactTel">T&eacute;l&eacute;phone</Label>
              <Input
                id="contactTel"
                value={contactTel}
                onChange={(e) => setContactTel(e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactSite">Site web</Label>
              <Input
                id="contactSite"
                value={contactSite}
                onChange={(e) => setContactSite(e.target.value)}
                placeholder="https://mongroupe.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? "Sauvegarde..." : "Sauvegarder le profil"}
        </Button>
      </div>
    </form>
  );
}
