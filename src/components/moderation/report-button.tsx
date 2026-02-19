"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReportButtonProps {
  targetType: "groupe" | "concert";
  targetId: string;
  targetName: string;
}

export function ReportButton({ targetType, targetId, targetName }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setReason("");
      setError("");
      setSuccess(false);
    }
  }

  const targetLabel = targetType === "groupe" ? "ce groupe" : "ce concert";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-1.5"
        >
          <Flag className="h-3.5 w-3.5" />
          Signaler
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler {targetLabel}</DialogTitle>
          <DialogDescription>
            Signalez un contenu inapproprié ou abusif concernant{" "}
            <strong>{targetName}</strong>. Notre équipe examinera votre
            signalement.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Flag className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Signalement envoyé</p>
            <p className="text-sm text-muted-foreground mt-1">
              Merci pour votre signalement. Nous l&apos;examinerons dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="reason">Motif du signalement</Label>
                <Textarea
                  id="reason"
                  placeholder="Décrivez le problème (contenu inapproprié, fausses informations, spam...)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  minLength={10}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading || reason.length < 10}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              >
                <Flag className="h-4 w-4" />
                {isLoading ? "Envoi..." : "Envoyer le signalement"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
