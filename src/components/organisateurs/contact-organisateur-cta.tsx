"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic2, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  organisateurId: string;
  organisateurNom: string;
}

export function ContactOrganisateurCTA({ organisateurId, organisateurNom }: Props) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [dateSouhaitee, setDateSouhaitee] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (status !== "loading" && session?.user?.role !== "GROUPE") {
    return (
      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Mic2 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
        Vous êtes un groupe ?{" "}
        <Link href="/register?role=GROUPE" className="text-orange-600 hover:underline font-medium">
          Créez votre profil
        </Link>{" "}
        pour contacter {organisateurNom} directement.
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Décrivez brièvement votre demande");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact-organisateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisateurId,
          message: message.trim(),
          dateSouhaitee: dateSouhaitee || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDone(true);
      toast.success("Votre demande a été envoyée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setDone(false);
          setMessage("");
          setDateSouhaitee("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
          <Mic2 className="h-4 w-4" />
          Demander à jouer chez {organisateurNom}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contacter {organisateurNom}</DialogTitle>
          <DialogDescription>
            Présentez votre groupe et proposez une date. {organisateurNom} recevra votre demande par email.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-medium">Demande envoyée !</p>
            <p className="text-sm text-muted-foreground mt-1">
              {organisateurNom} peut désormais vous répondre directement par email.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-date">Date souhaitée (optionnel)</Label>
              <Input
                id="contact-date"
                type="date"
                value={dateSouhaitee}
                onChange={(e) => setDateSouhaitee(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Votre message *</Label>
              <Textarea
                id="contact-message"
                placeholder="Présentez votre groupe, votre style musical, votre disponibilité..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                disabled={submitting}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Envoi...</>
              ) : (
                <><Send className="h-4 w-4" />Envoyer ma demande</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
