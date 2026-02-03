"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImageUploader } from "@/components/ui/image-uploader";
import { toast } from "sonner";
import {
  X,
  Plus,
  Youtube,
  ArrowRight,
  ArrowLeft,
  Check,
  ImageIcon,
  User,
  FileText,
  MapPin,
  Music,
  Mail,
  Sparkles,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupeProfileWizardProps {
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

const STEPS = [
  { id: "photo", title: "Photo de profil", icon: User, description: "Votre photo principale" },
  { id: "bio", title: "Présentation", icon: FileText, description: "Décrivez votre groupe" },
  { id: "photos", title: "Galerie photos", icon: ImageIcon, description: "Montrez votre univers" },
  { id: "videos", title: "Vidéos", icon: Youtube, description: "Vos performances live" },
  { id: "location", title: "Localisation", icon: MapPin, description: "Où êtes-vous basé ?" },
  { id: "genres", title: "Genres musicaux", icon: Music, description: "Votre style musical" },
  { id: "contact", title: "Contact", icon: Mail, description: "Comment vous joindre" },
];

export function GroupeProfileWizard({
  groupe,
  allGenres,
  isPremium,
}: GroupeProfileWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [nom, setNom] = useState(groupe.nom);
  const [bio, setBio] = useState(groupe.bio || "");
  const [ville, setVille] = useState(groupe.ville || "");
  const [codePostal, setCodePostal] = useState(groupe.codePostal || "");
  const [departement, setDepartement] = useState(groupe.departement || "");
  const [region, setRegion] = useState(groupe.region || "");
  const [contactEmail, setContactEmail] = useState(groupe.contactEmail || "");
  const [contactTel, setContactTel] = useState(groupe.contactTel || "");
  const [contactSite, setContactSite] = useState(groupe.contactSite || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(groupe.genres);
  const [photos, setPhotos] = useState<string[]>(groupe.photos || []);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(groupe.thumbnailUrl);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>(groupe.youtubeVideos);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const maxVideos = isPremium ? 5 : 3;
  const maxPhotos = isPremium ? 10 : 3;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

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

  async function saveProgress() {
    setIsLoading(true);
    try {
      // Convert empty strings to null for optional fields to pass validation
      const emptyToNull = (val: string) => val.trim() === "" ? null : val;

      const res = await fetch("/api/groupe/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom || "Mon Groupe",
          bio: emptyToNull(bio),
          ville: emptyToNull(ville),
          codePostal: emptyToNull(codePostal),
          departement: emptyToNull(departement),
          region: emptyToNull(region),
          contactEmail: emptyToNull(contactEmail),
          contactTel: emptyToNull(contactTel),
          contactSite: emptyToNull(contactSite),
          genres: selectedGenres,
          photos,
          thumbnailUrl,
          youtubeVideos,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.error?.message || data.error || "Erreur lors de la sauvegarde";
        toast.error(typeof errorMessage === "string" ? errorMessage : "Erreur lors de la sauvegarde");
        return false;
      }
      return true;
    } catch {
      toast.error("Erreur lors de la sauvegarde");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNext() {
    const saved = await saveProgress();
    if (saved) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        toast.success("Profil complété ! 🎉");
        router.push("/dashboard/groupe");
        router.refresh();
      }
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleSkip() {
    await saveProgress();
    router.push("/dashboard/groupe/profil");
  }

  function renderStepContent() {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "photo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Votre photo de profil est la première chose que les organisateurs verront.
                <br />
                <span className="text-orange-600 font-medium">Les groupes avec photos reçoivent 47% de clics en plus !</span>
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <ImageUploader
                  images={thumbnailUrl ? [thumbnailUrl] : []}
                  onImagesChange={(imgs) => setThumbnailUrl(imgs[0] || null)}
                  maxImages={1}
                  thumbnailUrl={thumbnailUrl}
                  onThumbnailChange={setThumbnailUrl}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        );

      case "bio":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Présentez votre groupe en quelques lignes. Parlez de votre style, votre histoire, vos influences...
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du groupe</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Les Rockers du Dimanche"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Présentation</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Nous sommes un groupe de rock acoustique formé en 2020..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length} caractères {bio.length < 100 && "(minimum recommandé : 100)"}
                </p>
              </div>
            </div>
          </div>
        );

      case "photos":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Ajoutez des photos de vos concerts, répétitions, ou de votre univers.
                <br />
                <span className="text-orange-600 font-medium">Minimum 3 photos recommandées.</span>
              </p>
            </div>
            <ImageUploader
              images={photos}
              onImagesChange={setPhotos}
              maxImages={maxPhotos}
              disabled={isLoading}
            />
            {!isPremium && photos.length >= maxPhotos && (
              <p className="text-sm text-muted-foreground text-center">
                Passez en Premium pour ajouter jusqu'à 10 photos.
              </p>
            )}
          </div>
        );

      case "videos":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                La vidéo est le meilleur moyen de convaincre les organisateurs !
                <br />
                Ajoutez des extraits de vos performances live.
              </p>
            </div>

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

            {youtubeVideos.length < maxVideos && (
              <div className="flex gap-2">
                <Input
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVideo())}
                />
                <Button type="button" variant="outline" onClick={addVideo}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            )}

            {youtubeVideos.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune vidéo ajoutée</p>
              </div>
            )}
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Indiquez votre localisation pour être trouvé par les organisateurs proches de chez vous.
              </p>
            </div>
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
        );

      case "genres":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Sélectionnez les genres musicaux qui correspondent à votre groupe.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {allGenres.map((genre) => (
                <Badge
                  key={genre.id}
                  variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all text-sm px-4 py-2",
                    selectedGenres.includes(genre.id)
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 scale-105"
                      : "hover:border-orange-300"
                  )}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.nom}
                </Badge>
              ))}
            </div>
            {selectedGenres.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {selectedGenres.length} genre{selectedGenres.length > 1 ? "s" : ""} sélectionné{selectedGenres.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Comment les organisateurs peuvent-ils vous contacter ?
              </p>
            </div>
            <div className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="contactTel">Téléphone</Label>
                <Input
                  id="contactTel"
                  value={contactTel}
                  onChange={(e) => setContactTel(e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactSite">Site web / Réseaux sociaux</Label>
                <Input
                  id="contactSite"
                  value={contactSite}
                  onChange={(e) => setContactSite(e.target.value)}
                  placeholder="https://mongroupe.com"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const StepIcon = STEPS[currentStep].icon;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <StepIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{STEPS[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Étape {currentStep + 1} sur {STEPS.length}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isCompleted && "bg-green-500 text-white",
                isCurrent && "bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-4 ring-orange-200",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              title={step.title}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Card className="flex-1 border-0 shadow-lg">
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isLoading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
          )}
        </div>

        <Button variant="ghost" onClick={handleSkip} disabled={isLoading} className="text-muted-foreground">
          <SkipForward className="h-4 w-4 mr-2" />
          Tout remplir d'un coup
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          {isLoading ? (
            "Sauvegarde..."
          ) : isLastStep ? (
            <>
              Terminer
              <Sparkles className="h-4 w-4" />
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
