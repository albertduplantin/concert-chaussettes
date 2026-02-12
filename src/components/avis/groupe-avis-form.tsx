"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";

interface Props {
  groupeId: string;
  groupeNom: string;
}

const STAR_LABELS = ["", "Décevant", "Passable", "Bien", "Très bien", "Excellent !"];

export function GroupeAvisForm({ groupeId, groupeNom }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (note === 0) { toast.error("Veuillez choisir une note."); return; }
    if (!email.trim()) { toast.error("Veuillez entrer votre email."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/avis/groupe/${groupeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nom: nom.trim() || undefined,
          note,
          commentaire: commentaire.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      setDone(true);
      toast.success("Merci pour votre avis !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayStar = hovered || note;

  if (done) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-800 dark:text-green-200">Merci pour votre avis !</p>
          <p className="text-sm text-green-700 dark:text-green-300">Il sera visible sur ce profil.</p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/20"
      >
        <PenLine className="h-4 w-4 text-orange-500" />
        Laisser un avis sur {groupeNom}
      </Button>
    );
  }

  return (
    <div className="border rounded-xl p-5 space-y-4 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Votre avis sur {groupeNom}</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-sm">
          Annuler
        </button>
      </div>

      {/* Stars */}
      <div className="flex flex-col items-start gap-1">
        <Label className="text-sm">Note *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setNote(s)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star className={`h-8 w-8 transition-colors ${s <= displayStar ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
            </button>
          ))}
        </div>
        {displayStar > 0 && (
          <p className="text-sm font-medium text-orange-600">{STAR_LABELS[displayStar]}</p>
        )}
      </div>

      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="avis-email">Email *</Label>
          <Input id="avis-email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="avis-nom">Nom (facultatif)</Label>
          <Input id="avis-nom" type="text" placeholder="Prénom Nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={255} />
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1">
        <Label htmlFor="avis-commentaire">Commentaire (facultatif)</Label>
        <Textarea id="avis-commentaire" placeholder="Partagez votre expérience..." value={commentaire} onChange={(e) => setCommentaire(e.target.value)} maxLength={1000} rows={3} />
      </div>

      <p className="text-xs text-muted-foreground">Un seul avis par adresse email.</p>

      <Button
        onClick={handleSubmit}
        disabled={submitting || note === 0 || !email.trim()}
        className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi...</> : "Envoyer mon avis"}
      </Button>
    </div>
  );
}
