"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, AlertCircle, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

interface AvisData {
  concert: { id: string; titre: string; date: string };
  groupe: { id: string; nom: string; thumbnailUrl: string | null };
}

interface Props {
  concertId: string;
  data: AvisData | null;
  error: string | null;
}

const STAR_LABELS = ["", "Décevant", "Passable", "Bien", "Très bien", "Excellent !"];

export function AvisConcertClient({ concertId, data, error }: Props) {
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (note === 0) {
      toast.error("Veuillez sélectionner une note.");
      return;
    }
    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/avis/concert/${concertId}`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">🎵</span> Concert Chaussettes
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-7 w-7 text-orange-500" />
            </div>
            <CardTitle>Donnez votre avis</CardTitle>
            {error ? (
              <CardDescription className="text-red-500">{error}</CardDescription>
            ) : data ? (
              <CardDescription>
                Comment avez-vous trouvé{" "}
                <span className="font-medium text-foreground">{data.groupe.nom}</span> ?
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            {error ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-center text-muted-foreground text-sm">{error}</p>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <CheckCircle className="h-14 w-14 text-green-500" />
                <h3 className="font-semibold text-lg">Merci pour votre avis !</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Votre retour aide à mettre en valeur les groupes de qualité.
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-6 w-6 ${s <= note ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            ) : data ? (
              <>
                {/* Concert info */}
                <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-3">
                  {data.groupe.thumbnailUrl ? (
                    <Image
                      src={data.groupe.thumbnailUrl}
                      alt={data.groupe.nom}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5 text-orange-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{data.concert.titre}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(data.concert.date), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setNote(s)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-9 w-9 transition-colors ${
                            s <= displayStar
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-orange-600 h-5">
                    {displayStar > 0 ? STAR_LABELS[displayStar] : ""}
                  </p>
                </div>

                {/* Identity */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="email">Adresse email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nom">Votre nom (facultatif)</Label>
                    <Input
                      id="nom"
                      type="text"
                      placeholder="Prénom Nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      maxLength={255}
                    />
                  </div>
                </div>

                {/* Comment */}
                <Textarea
                  placeholder="Un commentaire ? (facultatif)"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />

                <p className="text-xs text-muted-foreground text-center">
                  Un seul avis par adresse email par concert.
                </p>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || note === 0 || !email.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi en cours...</>
                  ) : (
                    "Envoyer mon avis"
                  )}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
