"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Loader2,
  Music,
  User,
  MapPin,
  BookOpen,
  Search,
  CalendarPlus,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  defaultNom: string;
}

const STEPS = [
  { id: "profil", label: "Mon profil" },
  { id: "guide", label: "Démarrer" },
];

export function OnboardingOrganisateurWizard({ defaultNom }: Props) {
  const [step, setStep] = useState<"profil" | "guide">("profil");
  const [nom, setNom] = useState(defaultNom);
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveProfil = async () => {
    if (!nom.trim()) {
      toast.error("Veuillez entrer votre nom.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/organisateur/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          ville: ville.trim() || undefined,
          codePostal: codePostal.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setStep("guide");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 flex items-center justify-center p-4">
      {/* Background decorations */}
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
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                step === s.id
                  ? "text-orange-600"
                  : i < STEPS.findIndex((x) => x.id === step)
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.id
                    ? "bg-orange-500 text-white"
                    : i < STEPS.findIndex((x) => x.id === step)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {i < STEPS.findIndex((x) => x.id === step) ? "✓" : i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-px transition-colors ${
                  i < STEPS.findIndex((x) => x.id === step) ? "bg-green-400" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === "profil" && (
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="h-7 w-7 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Complétez votre profil</h1>
                <p className="text-muted-foreground text-sm">
                  Ces informations permettent aux groupes de mieux vous connaître.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nom" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-500" />
                    Votre nom ou prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="ex : Marie, Les Dupont..."
                    className="h-11"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Apparaîtra dans vos invitations et sur les demandes aux groupes.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Votre ville
                    <span className="text-xs text-muted-foreground font-normal">(recommandé)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={codePostal}
                      onChange={(e) => setCodePostal(e.target.value)}
                      placeholder="22100"
                      className="h-11"
                      maxLength={5}
                    />
                    <Input
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      placeholder="Dinan"
                      className="h-11 col-span-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permet de trouver des groupes proches de chez vous sur la carte.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveProfil}
                disabled={saving || !nom.trim()}
                className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base"
              >
                {saving ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Enregistrement...</>
                ) : (
                  <>Continuer <ArrowRight className="h-5 w-5" /></>
                )}
              </Button>

              <button
                onClick={() => { window.location.href = "/dashboard/organisateur"; }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Passer pour l&apos;instant →
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Guide */}
        {step === "guide" && (
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Vous êtes prêt !</h1>
                <p className="text-muted-foreground text-sm">
                  Votre profil est enregistré. Voici comment organiser votre premier concert.
                </p>
              </div>

              {/* Mini guide */}
              <div className="space-y-3">
                {[
                  { icon: Search, text: "Trouvez un groupe sur la carte ou en liste", step: "1" },
                  { icon: CalendarPlus, text: "Créez un concert et invitez vos proches", step: "2" },
                  { icon: BookOpen, text: "Consultez le guide complet à tout moment", step: "3" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <item.icon className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <p className="text-sm font-medium">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-base"
                >
                  <Link href="/dashboard/organisateur/guide">
                    <BookOpen className="h-5 w-5" />
                    Voir le guide complet
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full h-11 gap-2">
                  <Link href="/dashboard/organisateur/search">
                    <Search className="h-4 w-4" />
                    Trouver un groupe directement
                  </Link>
                </Button>

                <button
                  onClick={() => { window.location.href = "/dashboard/organisateur"; }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Aller au tableau de bord →
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Le guide est accessible à tout moment depuis la sidebar.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
