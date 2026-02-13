"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import {
  ArrowRight,
  Loader2,
  Music,
  User,
  MapPin,
  Search,
  Star,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";

interface Genre {
  id: string;
  nom: string;
}

interface NearbyGroupe {
  id: string;
  nom: string;
  ville: string | null;
  thumbnailUrl: string | null;
  genres: string[];
  avgNote: number | null;
  avisCount: number;
}

interface Props {
  defaultNom: string;
  genres: Genre[];
}

type Step = "bienvenue" | "localisation" | "gouts" | "decouverte";

const STEPS: { id: Step; label: string }[] = [
  { id: "bienvenue", label: "Bienvenue" },
  { id: "localisation", label: "Localisation" },
  { id: "gouts", label: "Goûts" },
  { id: "decouverte", label: "Découverte" },
];

export function OnboardingOrganisateurWizard({ defaultNom, genres }: Props) {
  const [step, setStep] = useState<Step>("bienvenue");
  const [nom, setNom] = useState(defaultNom);
  const [villeSearch, setVilleSearch] = useState("");
  const [locationData, setLocationData] = useState<{
    ville: string;
    codePostal: string;
    departement: string;
    region: string;
  } | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [nearbyGroupes, setNearbyGroupes] = useState<NearbyGroupe[]>([]);
  const [loadingGroupes, setLoadingGroupes] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const handleSaveNom = async () => {
    if (!nom.trim()) {
      toast.error("Veuillez entrer votre nom.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/organisateur/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim() }),
      });
      if (!res.ok) throw new Error("Erreur");
      setStep("localisation");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationData) {
      toast.error("Veuillez sélectionner une ville.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/organisateur/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          ville: locationData.ville,
          codePostal: locationData.codePostal,
          departement: locationData.departement,
          region: locationData.region,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      setStep("gouts");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : prev.length < 5
        ? [...prev, genreId]
        : prev
    );
  };

  const handleGoToDecouverte = async () => {
    setStep("decouverte");
    setLoadingGroupes(true);
    try {
      const params = new URLSearchParams();
      if (locationData?.ville) params.set("q", locationData.ville);
      params.set("limit", "3");
      const res = await fetch(`/api/groupes/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNearbyGroupes(data.groupes?.slice(0, 3) || []);
      }
    } catch {
      // Pas grave, on montre juste les CTAs
    } finally {
      setLoadingGroupes(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 dark:bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Concert Chaussettes</span>
          </Link>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.id
                    ? "bg-orange-500 text-white"
                    : i < stepIndex
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span
                className={`hidden sm:inline text-xs font-medium transition-colors ${
                  step === s.id
                    ? "text-orange-600"
                    : i < stepIndex
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-6 sm:w-10 h-px transition-colors ${
                    i < stepIndex ? "bg-green-400" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Bienvenue — Nom */}
        {step === "bienvenue" && (
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="h-7 w-7 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Bienvenue !</h1>
                <p className="text-muted-foreground text-sm">
                  En 2 minutes, vous serez prêt à découvrir des groupes près de
                  chez vous.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nom" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  Comment vous appelez-vous ?{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex : Marie, Les Dupont..."
                  className="h-12 text-base"
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === "Enter" && nom.trim() && handleSaveNom()
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Apparaîtra dans vos messages et invitations aux groupes.
                </p>
              </div>

              <Button
                onClick={handleSaveNom}
                disabled={saving || !nom.trim()}
                className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Continuer <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  window.location.href = "/dashboard/organisateur";
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Passer pour l&apos;instant &rarr;
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Localisation */}
        {step === "localisation" && (
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-7 w-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Où habitez-vous ?</h1>
                <p className="text-muted-foreground text-sm">
                  Pour vous montrer les groupes proches de chez vous.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Votre ville
                </Label>
                <CityAutocomplete
                  value={villeSearch}
                  onChange={setVilleSearch}
                  onSelect={(city) => {
                    setLocationData(city);
                    setVilleSearch(city.ville);
                  }}
                  placeholder="Tapez votre ville..."
                  className="[&_input]:h-12 [&_input]:text-base"
                />
                {locationData && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    ✓ {locationData.ville}, {locationData.departement},{" "}
                    {locationData.region}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSaveLocation}
                disabled={saving || !locationData}
                className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Continuer <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <button
                onClick={() => setStep("gouts")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Passer cette étape &rarr;
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Goûts musicaux */}
        {step === "gouts" && (
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Music className="h-7 w-7 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">
                  Vos goûts musicaux ?
                </h1>
                <p className="text-muted-foreground text-sm">
                  Sélectionnez jusqu&apos;à 5 genres pour personnaliser vos
                  découvertes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {genres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500 shadow-md scale-105"
                          : "bg-white dark:bg-gray-800 text-foreground border-border hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                      }`}
                    >
                      {genre.nom}
                    </button>
                  );
                })}
              </div>

              {selectedGenres.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {selectedGenres.length}/5 genre
                  {selectedGenres.length > 1 ? "s" : ""} sélectionné
                  {selectedGenres.length > 1 ? "s" : ""}
                </p>
              )}

              <Button
                onClick={handleGoToDecouverte}
                className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base"
              >
                {selectedGenres.length > 0
                  ? "Découvrir les groupes"
                  : "Je veux tout découvrir"}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Découverte — Vrais groupes proches */}
        {step === "decouverte" && (
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Vous êtes prêt !</h1>
                <p className="text-muted-foreground text-sm">
                  {locationData
                    ? `Voici des groupes près de ${locationData.ville} :`
                    : "Découvrez les groupes disponibles :"}
                </p>
              </div>

              {/* Groupes preview */}
              {loadingGroupes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Recherche de groupes...
                  </span>
                </div>
              ) : nearbyGroupes.length > 0 ? (
                <div className="space-y-3">
                  {nearbyGroupes.map((g) => (
                    <Link
                      key={g.id}
                      href={`/groupes/${g.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      {g.thumbnailUrl ? (
                        <img
                          src={g.thumbnailUrl}
                          alt={g.nom}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-orange-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{g.nom}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {g.ville && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {g.ville}
                            </span>
                          )}
                          {g.avgNote && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {g.avgNote}
                            </span>
                          )}
                        </div>
                        {g.genres.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {g.genres.slice(0, 2).map((name) => (
                              <Badge
                                key={name}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  Explorez tous les groupes disponibles sur la plateforme.
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Button
                  asChild
                  className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base"
                >
                  <Link href="/dashboard/organisateur/search">
                    <Search className="h-5 w-5" />
                    Explorer tous les groupes
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-11 gap-2"
                >
                  <Link href="/dashboard/organisateur">
                    Aller au tableau de bord
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
