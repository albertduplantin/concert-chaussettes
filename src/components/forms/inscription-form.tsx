"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Sparkles, Users, Clock, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface InscriptionFormProps {
  concertId: string;
  isFull: boolean;
  maxInvites: number | null;
  confirmedCount: number;
}

export function InscriptionForm({
  concertId,
  isFull,
  maxInvites,
  confirmedCount,
}: InscriptionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState<string>("");

  const remainingSpots = maxInvites ? maxInvites - confirmedCount : null;
  const isAlmostFull = remainingSpots !== null && remainingSpots <= 10 && remainingSpots > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concertId,
          nom: formData.get("nom"),
          email: formData.get("email"),
          telephone: formData.get("telephone"),
          nombrePersonnes: Number(formData.get("nombrePersonnes")) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }

      setIsSubmitted(true);
      setStatus(data.inscription.status);
      toast.success(
        data.inscription.status === "LISTE_ATTENTE"
          ? "Vous etes sur la liste d'attente !"
          : "Inscription confirmee !"
      );
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center animate-bounce">
          {status === "LISTE_ATTENTE" ? (
            <Clock className="h-10 w-10 text-white" />
          ) : (
            <PartyPopper className="h-10 w-10 text-white" />
          )}
        </div>
        <h3 className="text-2xl font-bold mb-3">
          {status === "LISTE_ATTENTE"
            ? "Vous etes sur la liste d'attente !"
            : "C'est confirme !"}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {status === "LISTE_ATTENTE"
            ? "Nous vous prevenons des qu'une place se libere. Restez connecte !"
            : "Vous allez recevoir un email avec tous les details. A tres bientot !"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Urgency banner */}
      {isAlmostFull && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl animate-pulse">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Plus que {remainingSpots} place{remainingSpots! > 1 ? "s" : ""} disponible{remainingSpots! > 1 ? "s" : ""} !
          </span>
        </div>
      )}

      {/* Social proof */}
      {confirmedCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{confirmedCount} personne{confirmedCount > 1 ? "s" : ""} inscrite{confirmedCount > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nom" className="text-sm font-medium">
              Votre nom
            </Label>
            <Input
              id="nom"
              name="nom"
              placeholder="Jean Dupont"
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-2 focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Votre email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jean@email.com"
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-2 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telephone" className="text-sm font-medium">
              Telephone <span className="text-muted-foreground font-normal">(optionnel)</span>
            </Label>
            <Input
              id="telephone"
              name="telephone"
              placeholder="06 12 34 56 78"
              disabled={isLoading}
              className="h-12 rounded-xl border-2 focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombrePersonnes" className="text-sm font-medium">
              Nombre de places
            </Label>
            <Input
              id="nombrePersonnes"
              name="nombrePersonnes"
              type="number"
              min={1}
              max={10}
              defaultValue={1}
              disabled={isLoading}
              className="h-12 rounded-xl border-2 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className={cn(
            "w-full h-14 text-lg font-semibold rounded-xl transition-all duration-300",
            isFull
              ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
              : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 hover:scale-[1.02] shadow-lg shadow-orange-500/25"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Inscription en cours...
            </span>
          ) : isFull ? (
            "Rejoindre la liste d'attente"
          ) : (
            "Je reserve ma place"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En vous inscrivant, vous acceptez de recevoir les informations relatives a cet evenement.
        </p>
      </form>
    </div>
  );
}
