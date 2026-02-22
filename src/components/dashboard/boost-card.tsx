"use client";

import { useState } from "react";
import { Zap, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BoostCardProps {
  isBoosted: boolean;
  boostExpiresAt: Date | null;
}

export function BoostCard({ isBoosted, boostExpiresAt }: BoostCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isActive = isBoosted && boostExpiresAt && new Date(boostExpiresAt) > new Date();
  const daysLeft = isActive
    ? Math.ceil((new Date(boostExpiresAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  async function handleBoost() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/create-boost-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Une erreur est survenue. Veuillez réessayer.");
        setIsLoading(false);
      }
    } catch {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  }

  if (isActive) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-l-4 border-l-amber-400">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                <Zap className="h-5 w-5 text-amber-600 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Profil boosté !</p>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                  {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""} — expire le{" "}
                  {new Date(boostExpiresAt!).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBoost}
              disabled={isLoading}
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {isLoading ? "..." : "Renouveler"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <CardContent className="relative z-10 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Zap className="h-6 w-6 text-white fill-white/50" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Boostez votre visibilité</p>
              <p className="text-white/85 text-sm mt-0.5">
                Apparaissez en tête des recherches pendant 30 jours
              </p>
              <p className="text-white/70 text-xs mt-1">
                Plus de vues = plus de demandes d'organisateurs
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold">9€</p>
            <p className="text-white/70 text-xs">30 jours</p>
            <Button
              onClick={handleBoost}
              disabled={isLoading}
              size="sm"
              className="mt-2 bg-white text-orange-600 hover:bg-white/90 gap-1.5 font-semibold"
            >
              {isLoading ? "Chargement..." : (
                <>
                  Booster
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
