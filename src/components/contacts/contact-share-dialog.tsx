"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, Loader2, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ShareToken {
  id: string;
  token: string;
  label: string | null;
  expiresAt: string;
  maxUses: number | null;
  usedCount: number;
  isRevoked: boolean;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactsCount: number;
}

export function ContactShareDialog({ open, onOpenChange, contactsCount }: Props) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [rgpdAgreed, setRgpdAgreed] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organisateur/contacts/share");
      if (res.ok) setTokens(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) { fetchTokens(); setGeneratedUrl(""); setRgpdAgreed(false); }
  }, [open]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/organisateur/contacts/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 7, maxUses: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedUrl(data.url);
      await fetchTokens();
      toast.success("Lien de partage créé !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (url: string) => {
    const msg = encodeURIComponent(`Voici un lien pour importer mes contacts Concert Chaussettes : ${url}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/organisateur/contacts/share/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTokens((prev) => prev.filter((t) => t.id !== id));
      if (generatedUrl.includes(tokens.find(t => t.id === id)?.token || "")) setGeneratedUrl("");
      toast.success("Lien révoqué.");
    } catch {
      toast.error("Erreur lors de la révocation.");
    }
  };

  const buildUrl = (token: string) => {
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app";
    return `${base}/import-contacts/${token}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-500" />
            Partager mes contacts
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="create">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="create">Créer un lien</TabsTrigger>
            <TabsTrigger value="active">
              Liens actifs
              {tokens.length > 0 && <Badge className="ml-2 h-5 px-1.5 text-xs">{tokens.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">Vous partagez {contactsCount} contacts</p>
              <p className="text-muted-foreground">Le lien sera valide 7 jours et utilisable 10 fois maximum.</p>
            </div>

            {/* RGPD warning */}
            <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  En partageant ces contacts, vous confirmez avoir l&apos;autorisation de transmettre ces données personnelles à un tiers, conformément au RGPD. Vous êtes responsable de cette transmission.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rgpdAgreed}
                  onChange={(e) => setRgpdAgreed(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs font-medium">J&apos;ai pris connaissance et j&apos;accepte</span>
              </label>
            </div>

            {!generatedUrl ? (
              <Button
                onClick={handleGenerate}
                disabled={generating || !rgpdAgreed || contactsCount === 0}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération...</> : "Générer un lien de partage"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <input
                    readOnly
                    value={generatedUrl}
                    className="flex-1 bg-transparent text-xs truncate focus:outline-none"
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(generatedUrl)}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleCopy(generatedUrl)} className="gap-2">
                    <Copy className="h-4 w-4" />Copier le lien
                  </Button>
                  <Button variant="outline" onClick={() => handleWhatsApp(generatedUrl)} className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
                    <ExternalLink className="h-4 w-4" />Envoyer WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Aucun lien actif</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tokens.map((t) => {
                  const url = buildUrl(t.token);
                  return (
                    <div key={t.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Créé le {format(new Date(t.createdAt), "d MMM yyyy", { locale: fr })}</p>
                          <p>Expire le {format(new Date(t.expiresAt), "d MMM yyyy", { locale: fr })}</p>
                          <p>{t.usedCount} / {t.maxUses ?? "∞"} utilisations</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(t.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleCopy(url)}>
                          <Copy className="h-3.5 w-3.5" />Copier
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1 text-green-600" onClick={() => handleWhatsApp(url)}>
                          <ExternalLink className="h-3.5 w-3.5" />WhatsApp
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
