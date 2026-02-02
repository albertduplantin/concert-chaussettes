"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Home, Guitar, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoleSelectionFormProps {
  userName?: string | null;
}

export function RoleSelectionForm({ userName }: RoleSelectionFormProps) {
  const { update } = useSession();
  const [selectedRole, setSelectedRole] = useState<"ORGANISATEUR" | "GROUPE" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selectedRole) {
      toast.error("Veuillez sélectionner un profil");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la mise à jour");
        return;
      }

      // Force refresh the session to update needsOnboarding flag
      await update();

      toast.success("Bienvenue sur Concert Chaussettes !");

      // Hard redirect to ensure fresh session state
      if (selectedRole === "GROUPE") {
        window.location.href = "/dashboard/groupe";
      } else {
        window.location.href = "/dashboard/organisateur";
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 dark:bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Concert Chaussettes</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium mx-auto mb-2">
            <Sparkles className="h-4 w-4" />
            Bienvenue{userName ? ` ${userName}` : ""} !
          </div>
          <CardTitle className="text-2xl">Choisissez votre profil</CardTitle>
          <CardDescription>
            Comment souhaitez-vous utiliser Concert Chaussettes ?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organisateur */}
            <button
              type="button"
              onClick={() => setSelectedRole("ORGANISATEUR")}
              disabled={isSubmitting}
              className={cn(
                "relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
                selectedRole === "ORGANISATEUR"
                  ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-lg"
                  : "border-muted hover:border-orange-200 dark:hover:border-orange-800"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl transition-colors",
                selectedRole === "ORGANISATEUR"
                  ? "bg-gradient-to-br from-orange-500 to-amber-500"
                  : "bg-muted"
              )}>
                <Home className={cn(
                  "h-10 w-10",
                  selectedRole === "ORGANISATEUR" ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-center">
                <p className={cn(
                  "font-semibold text-lg",
                  selectedRole === "ORGANISATEUR" ? "text-orange-600 dark:text-orange-400" : ""
                )}>
                  Organisateur
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Je veux organiser des concerts privés chez moi et accueillir des groupes
                </p>
              </div>
            </button>

            {/* Groupe */}
            <button
              type="button"
              onClick={() => setSelectedRole("GROUPE")}
              disabled={isSubmitting}
              className={cn(
                "relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
                selectedRole === "GROUPE"
                  ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-lg"
                  : "border-muted hover:border-orange-200 dark:hover:border-orange-800"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl transition-colors",
                selectedRole === "GROUPE"
                  ? "bg-gradient-to-br from-orange-500 to-amber-500"
                  : "bg-muted"
              )}>
                <Guitar className={cn(
                  "h-10 w-10",
                  selectedRole === "GROUPE" ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-center">
                <p className={cn(
                  "font-semibold text-lg",
                  selectedRole === "GROUPE" ? "text-orange-600 dark:text-orange-400" : ""
                )}>
                  Groupe / Artiste
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Je veux proposer mes services pour jouer des concerts privés
                </p>
              </div>
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="w-full gap-2 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Configuration...
              </>
            ) : (
              <>
                Continuer
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
