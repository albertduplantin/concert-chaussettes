"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, CheckCircle } from "lucide-react";

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
          ? "Vous êtes sur la liste d'attente !"
          : "Inscription confirmée !"
      );
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card className="text-center p-8">
        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          {status === "LISTE_ATTENTE"
            ? "Vous êtes sur la liste d'attente"
            : "Inscription confirmée !"}
        </h3>
        <p className="text-muted-foreground">
          {status === "LISTE_ATTENTE"
            ? "Vous serez prévenu si une place se libère."
            : "Vous recevrez les détails du concert par email."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {isFull ? "S'inscrire sur la liste d'attente" : "S'inscrire"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                name="nom"
                placeholder="Votre nom"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">T&eacute;l&eacute;phone (optionnel)</Label>
              <Input
                id="telephone"
                name="telephone"
                placeholder="06 12 34 56 78"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombrePersonnes">Nombre de personnes</Label>
              <Input
                id="nombrePersonnes"
                name="nombrePersonnes"
                type="number"
                min={1}
                max={10}
                defaultValue={1}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Inscription..."
              : isFull
                ? "S'inscrire sur la liste d'attente"
                : "Confirmer mon inscription"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
