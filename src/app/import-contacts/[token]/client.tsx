"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface SharePreview {
  organisateurNom: string;
  contactsCount: number;
  preview: { nom: string; emailMasked: string }[];
  expiresAt: string | Date;
}

interface Props {
  token: string;
  preview: SharePreview | null;
  error: string | null;
}

export function ImportContactsClient({ token, preview, error }: Props) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch(`/api/contacts/import/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setResult({ imported: data.imported, skipped: data.skipped });
      setDone(true);
      toast.success(`${data.imported} contacts importés !`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

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
              <Users className="h-7 w-7 text-orange-500" />
            </div>
            <CardTitle>Partage de contacts</CardTitle>
            {error ? (
              <CardDescription className="text-red-500">{error}</CardDescription>
            ) : (
              <CardDescription>
                {preview?.organisateurNom} souhaite partager sa liste de contacts avec vous.
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-center text-muted-foreground text-sm">{error}</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/organisateur/contacts">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Mes contacts
                  </Link>
                </Button>
              </div>
            ) : done && result ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-semibold text-lg">Import réussi !</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                    <p className="text-xs text-muted-foreground">Nouveaux contacts</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                    <p className="text-xs text-muted-foreground">Déjà existants</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => router.push("/dashboard/organisateur/contacts")}
                >
                  Voir mes contacts
                </Button>
              </div>
            ) : preview ? (
              <>
                {/* Summary */}
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
                  <p className="font-semibold text-lg text-center">{preview.contactsCount} contacts</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Expire le {format(new Date(preview.expiresAt), "d MMMM yyyy", { locale: fr })}
                  </p>
                </div>

                {/* Preview table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Nom</th>
                        <th className="px-3 py-2 text-left font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{c.nom}</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{c.emailMasked}</td>
                        </tr>
                      ))}
                      {preview.contactsCount > 5 && (
                        <tr className="border-t bg-muted/20">
                          <td colSpan={2} className="px-3 py-2 text-center text-xs text-muted-foreground">
                            + {preview.contactsCount - 5} autres contacts...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {importing ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Import en cours...</>
                  ) : (
                    `Importer ${preview.contactsCount} contacts`
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/dashboard/organisateur/contacts">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Annuler
                  </Link>
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
