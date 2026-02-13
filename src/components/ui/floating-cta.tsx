"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Send, Calendar, MapPin, Users, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FloatingCTAProps {
  groupeId: string;
  groupeName?: string;
}

export function FloatingCTA({ groupeId, groupeName }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [nombreInvites, setNombreInvites] = useState("");
  const [typeEvenement, setTypeEvenement] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupeId,
          nom: formData.get("nom"),
          email: formData.get("email"),
          telephone: formData.get("telephone") || undefined,
          dateSouhaitee: formData.get("dateSouhaitee"),
          nombreInvites: nombreInvites || undefined,
          lieu: formData.get("lieu"),
          typeEvenement: typeEvenement || undefined,
          message: formData.get("message") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Erreur lors de l'envoi");
      }

      setIsSuccess(true);
      toast.success("Votre demande de devis a été envoyée !");

      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className={cn(
            "fixed bottom-6 right-6 z-40 gap-2 shadow-2xl transition-all duration-300",
            "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
            "hover:scale-105 hover:shadow-orange-500/25",
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-16 opacity-0 pointer-events-none"
          )}
        >
          <FileText className="h-5 w-5" />
          <span className="hidden sm:inline">Demander un devis</span>
          <span className="sm:hidden">Devis</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Demander un devis
          </DialogTitle>
          <DialogDescription>
            {groupeName
              ? `Demandez un devis à ${groupeName} pour votre événement`
              : "Décrivez votre événement et recevez un devis personnalisé"}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Demande envoyée !</h3>
            <p className="text-muted-foreground">
              Vous recevrez une réponse dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Votre nom</Label>
                <Input
                  id="nom"
                  name="nom"
                  placeholder="Jean Dupont"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone (optionnel)</Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                placeholder="06 12 34 56 78"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateSouhaitee" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date souhaitée
                </Label>
                <Input
                  id="dateSouhaitee"
                  name="dateSouhaitee"
                  type="date"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Nombre d&apos;invités
                </Label>
                <Select disabled={isSubmitting} value={nombreInvites} onValueChange={setNombreInvites}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-20">10-20 personnes</SelectItem>
                    <SelectItem value="20-30">20-30 personnes</SelectItem>
                    <SelectItem value="30-50">30-50 personnes</SelectItem>
                    <SelectItem value="50+">Plus de 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Lieu de l&apos;événement
              </Label>
              <Input
                id="lieu"
                name="lieu"
                placeholder="Ville ou adresse"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Type d&apos;événement</Label>
              <Select disabled={isSubmitting} value={typeEvenement} onValueChange={setTypeEvenement}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concert-prive">Concert privé</SelectItem>
                  <SelectItem value="anniversaire">Anniversaire</SelectItem>
                  <SelectItem value="mariage">Mariage</SelectItem>
                  <SelectItem value="entreprise">Événement d&apos;entreprise</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Décrivez votre événement, vos attentes, le style de musique souhaité..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
