"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, QrCode, Copy, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

interface Props {
  concertId: string;
  groupeId: string;
  groupeNom: string;
  alreadyReviewed: boolean;
  appUrl: string;
}

export function ConcertAvisSection({ concertId, groupeId, groupeNom, alreadyReviewed, appUrl }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(alreadyReviewed);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrCopied, setQrCopied] = useState(false);

  const reviewUrl = `${appUrl}/avis/concert/${concertId}`;

  useEffect(() => {
    QRCode.toDataURL(reviewUrl, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [reviewUrl]);

  const handleSubmit = async () => {
    if (!note) { toast.error("Choisissez une note"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupeId, concertId, note, commentaire: commentaire || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Merci pour votre avis !");
      setDone(true);
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(reviewUrl);
    setQrCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setQrCopied(false), 2000);
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-yellow-400" />
          Avis sur {groupeNom}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organizer vote */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20">
          <div>
            <p className="font-medium text-sm">Votre avis en tant qu&apos;organisateur</p>
            {done ? (
              <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                <Check className="h-3 w-3" />Avis déjà déposé
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Évaluez ce groupe après le concert</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={done}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {done ? "Noté" : "Évaluer"}
          </Button>
        </div>

        {/* QR code for public reviews */}
        <div>
          <p className="font-medium text-sm mb-3 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            Lien d&apos;avis pour vos invités
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Partagez ce QR code ou ce lien à l&apos;issue du concert pour collecter les avis de vos invités.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {qrDataUrl && (
              <div className="p-2 bg-white rounded-xl border shadow-sm shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR code avis" width={128} height={128} />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                <input
                  readOnly
                  value={reviewUrl}
                  className="flex-1 bg-transparent text-xs truncate focus:outline-none"
                />
                <Button size="sm" variant="ghost" onClick={handleCopyUrl} className="shrink-0">
                  {qrCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chaque visiteur devra entrer son email — un avis par email par concert.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Vote dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Évaluer {groupeNom}</DialogTitle>
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
                      i < (hovered || note)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {note > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {["", "Décevant", "Passable", "Bien", "Très bien", "Excellent !"][note]}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="commentaire"
                placeholder="Partagez votre expérience..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving || !note} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi...</> : "Publier l'avis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
