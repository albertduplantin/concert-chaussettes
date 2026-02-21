"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Music,
  Home,
  Guitar,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  MapPin,
  User,
  Mail,
  Lock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const GENRES = [
  "Acoustic",
  "Blues",
  "Chanson française",
  "Folk",
  "Jazz",
  "Pop",
  "Rock",
  "Soul",
  "Swing",
  "World",
];

const REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Hauts-de-France",
  "Provence-Alpes-Côte d'Azur",
  "Grand Est",
  "Pays de la Loire",
  "Bretagne",
  "Normandie",
  "Centre-Val de Loire",
  "Bourgogne-Franche-Comté",
  "Corse",
];

interface FormData {
  role: "GROUPE" | "ORGANISATEUR";
  nom: string;
  email: string;
  password: string;
  confirmPassword: string;
  ville: string;
  region: string;
  genres: string[];
  bio: string;
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterWizard />
    </Suspense>
  );
}

function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "GROUPE" ? "GROUPE" : "ORGANISATEUR";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    role: defaultRole,
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    ville: "",
    region: "",
    genres: [],
    bio: "",
  });

  const totalSteps = 3;
  const isGroupeFlow = formData.role === "GROUPE";

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("Erreur de connexion avec Google");
      setIsGoogleLoading(false);
    }
  }

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      return true; // Role is always selected
    }
    if (currentStep === 2) {
      if (!formData.nom.trim()) {
        toast.error(isGroupeFlow ? "Entrez le nom de votre groupe" : "Entrez votre nom");
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        toast.error("Entrez une adresse email valide");
        return false;
      }
      if (formData.password.length < 8) {
        toast.error("Le mot de passe doit contenir au moins 8 caractères");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Les mots de passe ne correspondent pas");
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  async function handleSubmit() {
    if (!validateStep(step)) return;

    setIsLoading(true);

    try {
      // Step 1: Create account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          nom: formData.nom,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || data.error || "Erreur lors de l'inscription");
        setIsLoading(false);
        return;
      }

      // Step 2: Auto login via NextAuth
      const loginResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.error) {
        toast.success("Compte créé ! Connectez-vous.");
        router.push("/login");
        return;
      }

      // Step 3: Update profile with additional info (for groups)
      if (isGroupeFlow && (formData.ville || formData.region || formData.genres.length > 0 || formData.bio)) {
        try {
          await fetch("/api/groupe/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ville: formData.ville,
              region: formData.region,
              genres: formData.genres,
              bio: formData.bio,
            }),
          });
        } catch {
          // Profile update is optional, continue anyway
        }
      }

      toast.success("Bienvenue sur Concert Chaussettes !");
      window.location.href = isGroupeFlow ? "/dashboard/groupe" : "/onboarding/organisateur";
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 dark:bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-xl relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Concert Chaussettes</span>
          </Link>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            {step === 1 && "Choisissez votre profil"}
            {step === 2 && "Vos informations de connexion"}
            {step === 3 && (isGroupeFlow ? "Parlez-nous de votre groupe" : "Vos préférences")}
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                    s < step && "bg-green-500 text-white",
                    s === step && "bg-gradient-to-r from-orange-500 to-amber-500 text-white scale-110",
                    s > step && "bg-muted text-muted-foreground"
                  )}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < totalSteps && (
                  <div
                    className={cn(
                      "w-12 h-1 mx-1 rounded transition-all duration-300",
                      s < step ? "bg-green-500" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateField("role", "ORGANISATEUR")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
                    formData.role === "ORGANISATEUR"
                      ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-lg"
                      : "border-muted hover:border-orange-200 dark:hover:border-orange-800"
                  )}
                >
                  {formData.role === "ORGANISATEUR" && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "p-4 rounded-2xl transition-colors",
                    formData.role === "ORGANISATEUR"
                      ? "bg-gradient-to-br from-orange-500 to-amber-500"
                      : "bg-muted"
                  )}>
                    <Home className={cn(
                      "h-8 w-8",
                      formData.role === "ORGANISATEUR" ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold",
                      formData.role === "ORGANISATEUR" ? "text-orange-600 dark:text-orange-400" : ""
                    )}>
                      Organisateur
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Je veux accueillir des concerts
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("role", "GROUPE")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
                    formData.role === "GROUPE"
                      ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-lg"
                      : "border-muted hover:border-orange-200 dark:hover:border-orange-800"
                  )}
                >
                  {formData.role === "GROUPE" && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "p-4 rounded-2xl transition-colors",
                    formData.role === "GROUPE"
                      ? "bg-gradient-to-br from-orange-500 to-amber-500"
                      : "bg-muted"
                  )}>
                    <Guitar className={cn(
                      "h-8 w-8",
                      formData.role === "GROUPE" ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold",
                      formData.role === "GROUPE" ? "text-orange-600 dark:text-orange-400" : ""
                    )}>
                      Groupe
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Je veux jouer des concerts
                    </p>
                  </div>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou inscription rapide</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 h-12"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                Continuer avec Google
              </Button>
            </div>
          )}

          {/* Step 2: Account Info */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="nom" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {isGroupeFlow ? "Nom du groupe" : "Votre nom"}
                </Label>
                <Input
                  id="nom"
                  placeholder={isGroupeFlow ? "Ex: Les Chaussettes Rouges" : "Ex: Jean Dupont"}
                  value={formData.nom}
                  onChange={(e) => updateField("nom", e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Mot de passe
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="Minimum 8 caractères"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Confirmer le mot de passe
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Step 3: Profile Setup */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {isGroupeFlow ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ville" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Ville
                      </Label>
                      <Input
                        id="ville"
                        placeholder="Ex: Paris"
                        value={formData.ville}
                        onChange={(e) => updateField("ville", e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Région</Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => updateField("region", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Genres musicaux</Label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          disabled={isLoading}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                            formData.genres.includes(genre)
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          )}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (optionnel)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Présentez votre groupe en quelques mots..."
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 mb-4">
                    <Sparkles className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Tout est prêt !</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Vous pourrez parcourir les groupes, créer des concerts et gérer vos invités dès votre inscription terminée.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={isLoading}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  <>
                    Terminer l'inscription
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-orange-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
