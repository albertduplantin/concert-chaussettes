"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  organisateurId: string;
  organisateurNom: string;
  concertId: string;
  alreadyRated: boolean;
}

const STAR_LABELS = ["", "Décevant", "Passable", "Bien", "Très bien", "Excellent !"];

export function OrganisateurAvisButton({ organisateurId, organisateurNom, concertId, alreadyRated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);

  if (alreadyRated) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        Organisateur noté
      </span>
    );
  }

  const handleSubmit = async () => {
    if (!note) {
      toast.error("Choisissez une note");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/avis/organisateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisateurId, concertId, note, commentaire: commentaire || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Merci pour votre avis !");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const displayStar = hovered || note;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
          <Star className="h-3.5 w-3.5" />
          Noter l&apos;organisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Noter {organisateurNom}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setHovered(i + 1)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setNote(i + 1)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    i < displayStar ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {displayStar > 0 && (
            <p className="text-center text-sm text-muted-foreground">{STAR_LABELS[displayStar]}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="org-commentaire">Commentaire (optionnel)</Label>
            <Textarea
              id="org-commentaire"
              placeholder="L'accueil, l'ambiance, l'organisation..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Votre avis restera masqué tant que {organisateurNom} n&apos;a pas aussi répondu (ou après 14 jours) — pour des avis honnêtes des deux côtés.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving || !note} className="bg-orange-500 hover:bg-orange-600">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi...</> : "Publier l'avis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
