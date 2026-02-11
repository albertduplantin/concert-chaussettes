"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, ClipboardList, Link2, CheckCircle, AlertCircle, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ParsedContact {
  email: string;
  nom?: string;
  telephone?: string;
}

interface SharePreview {
  organisateurNom: string;
  contactsCount: number;
  preview: { nom: string; emailMasked: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

function extractEmailsFromText(text: string): ParsedContact[] {
  const matches = text.match(EMAIL_REGEX) || [];
  const unique = [...new Set(matches.map((e) => e.toLowerCase()))];
  return unique.map((email) => ({ email }));
}

function detectColumn(headers: string[], candidates: string[]): string | null {
  for (const h of headers) {
    if (candidates.some((c) => h.toLowerCase().includes(c))) return h;
  }
  return null;
}

function detectEmailColumn(headers: string[]): string | null {
  // Exact match first
  const exact = headers.find((h) => ["email", "e-mail", "mail", "courriel"].includes(h.toLowerCase()));
  if (exact) return exact;
  // Google Contacts: "E-mail 1 - Value" (prefer "value" columns, skip "label" columns)
  const valueCol = headers.find(
    (h) => (h.toLowerCase().includes("e-mail") || h.toLowerCase().includes("email")) && h.toLowerCase().includes("value")
  );
  if (valueCol) return valueCol;
  // Fallback: any email-looking column that is NOT a label
  return headers.find(
    (h) =>
      (h.toLowerCase().includes("email") || h.toLowerCase().includes("e-mail") || h.toLowerCase().includes("mail")) &&
      !h.toLowerCase().includes("label")
  ) || null;
}

function detectPhoneColumn(headers: string[]): string | null {
  // Google Contacts: "Phone 1 - Value" (skip label/type columns)
  const valueCol = headers.find(
    (h) =>
      (h.toLowerCase().includes("phone") || h.toLowerCase().includes("tel") || h.toLowerCase().includes("mobile")) &&
      h.toLowerCase().includes("value")
  );
  if (valueCol) return valueCol;
  // Fallback: any phone-looking column that is NOT a label
  return headers.find(
    (h) =>
      (h.toLowerCase().includes("tel") || h.toLowerCase().includes("phone") || h.toLowerCase().includes("mobile") || h.toLowerCase().includes("portable")) &&
      !h.toLowerCase().includes("label") && !h.toLowerCase().includes("type")
  ) || null;
}

function buildFullName(row: Record<string, string>, headers: string[]): string | undefined {
  // Google Contacts: separate "First Name" and "Last Name" columns
  const firstCol = headers.find((h) => h.toLowerCase() === "first name");
  const lastCol = headers.find((h) => h.toLowerCase() === "last name");
  if (firstCol || lastCol) {
    const parts = [firstCol ? row[firstCol]?.trim() : "", lastCol ? row[lastCol]?.trim() : ""].filter(Boolean);
    return parts.join(" ") || undefined;
  }
  // Generic: single name column
  const nomCol = detectColumn(headers, ["nom", "name", "prenom", "prénom", "contact"]);
  return nomCol ? (row[nomCol] || "").trim() || undefined : undefined;
}

export function ContactImportDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tab, setTab] = useState("file");
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [source, setSource] = useState("import_csv");
  const [sourceLabel, setSourceLabel] = useState("");
  const [onDuplicate, setOnDuplicate] = useState<"ignore" | "update">("ignore");
  const [pasteText, setPasteText] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [sharePreview, setSharePreview] = useState<SharePreview | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);

  const reset = () => {
    setStep(1);
    setTab("file");
    setParsedContacts([]);
    setSkippedCount(0);
    setPasteText("");
    setShareToken("");
    setSharePreview(null);
    setShareError("");
    setResult(null);
    setImporting(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  // CSV / VCF parsing
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.name.endsWith(".vcf")) {
      await parseVcf(file);
    } else {
      parseCsv(file);
    }
  }, []);

  const parseCsv = (file: File) => {
    const now = new Date().toLocaleDateString("fr-FR");
    setSourceLabel(`Import CSV – ${now}`);
    setSource("import_csv");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const emailCol = detectEmailColumn(headers);
        const telCol = detectPhoneColumn(headers);

        if (!emailCol) {
          toast.error("Impossible de détecter la colonne email dans ce fichier.");
          return;
        }

        let valid = 0;
        let invalid = 0;
        const contacts: ParsedContact[] = [];

        for (const row of results.data as Record<string, string>[]) {
          const email = (row[emailCol] || "").trim().toLowerCase();
          if (!EMAIL_REGEX.test(email)) { invalid++; continue; }
          EMAIL_REGEX.lastIndex = 0;
          contacts.push({
            email,
            nom: buildFullName(row, headers),
            telephone: telCol ? (row[telCol] || "").trim() || undefined : undefined,
          });
          valid++;
        }

        setSkippedCount(invalid);
        setParsedContacts(contacts);
        if (valid > 0) setStep(2);
        else toast.error("Aucun email valide trouvé dans ce fichier.");
      },
      error: () => toast.error("Erreur lors de la lecture du fichier CSV."),
    });
  };

  const parseVcf = async (file: File) => {
    const now = new Date().toLocaleDateString("fr-FR");
    setSourceLabel(`Import VCF – ${now}`);
    setSource("import_vcf");

    const text = await file.text();
    // Basic vCard parser: extract FN and EMAIL fields
    const vcards = text.split(/BEGIN:VCARD/i).slice(1);
    const contacts: ParsedContact[] = [];
    let invalid = 0;

    for (const vcard of vcards) {
      const emailMatch = vcard.match(/^EMAIL[^:]*:(.+)$/im);
      const fnMatch = vcard.match(/^FN[^:]*:(.+)$/im);
      const telMatch = vcard.match(/^TEL[^:]*:(.+)$/im);

      const email = emailMatch?.[1]?.trim().toLowerCase();
      if (!email || !EMAIL_REGEX.test(email)) { invalid++; EMAIL_REGEX.lastIndex = 0; continue; }
      EMAIL_REGEX.lastIndex = 0;

      contacts.push({
        email,
        nom: fnMatch?.[1]?.trim() || undefined,
        telephone: telMatch?.[1]?.trim() || undefined,
      });
    }

    setSkippedCount(invalid);
    setParsedContacts(contacts);
    if (contacts.length > 0) setStep(2);
    else toast.error("Aucun email valide trouvé dans ce fichier VCF.");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/vcard": [".vcf"], "text/x-vcard": [".vcf"] },
    maxFiles: 1,
  });

  // Paste handling
  const handleParsePaste = () => {
    const contacts = extractEmailsFromText(pasteText);
    if (contacts.length === 0) {
      toast.error("Aucun email valide détecté.");
      return;
    }
    const now = new Date().toLocaleDateString("fr-FR");
    setSource("import_paste");
    setSourceLabel(`Copier-coller – ${now}`);
    setParsedContacts(contacts);
    setSkippedCount(0);
    setStep(2);
  };

  // Share token handling
  const handlePreviewShare = async () => {
    const token = shareToken.trim().split("/").pop() || "";
    if (!token) return;
    setShareLoading(true);
    setShareError("");
    try {
      const res = await fetch(`/api/contacts/preview/${token}`);
      const data = await res.json();
      if (!res.ok) { setShareError(data.error || "Erreur"); return; }
      setSharePreview(data);
      setSource("import_partage");
      setSourceLabel(`Partagé par ${data.organisateurNom}`);
      setStep(2);
    } catch {
      setShareError("Impossible de vérifier ce lien.");
    } finally {
      setShareLoading(false);
    }
  };

  // Final import
  const handleImport = async () => {
    setImporting(true);
    try {
      let res: Response;

      if (source === "import_partage") {
        const token = shareToken.trim().split("/").pop() || "";
        res = await fetch(`/api/contacts/import/${token}`, { method: "POST" });
      } else {
        res = await fetch("/api/organisateur/contacts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts: parsedContacts, source, sourceLabel, onDuplicate }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      setResult({ imported: data.imported, updated: data.updated || 0, skipped: data.skipped });
      setStep(3);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  const contactCount = source === "import_partage" ? (sharePreview?.contactsCount || 0) : parsedContacts.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Importer des contacts
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step > s ? "bg-green-500 text-white" :
                step === s ? "bg-orange-500 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              <span className={`text-sm ${step === s ? "font-medium" : "text-muted-foreground"}`}>
                {s === 1 ? "Source" : s === 2 ? "Aperçu" : "Résultat"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Source selection */}
        {step === 1 && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="file" className="gap-2"><FileText className="h-4 w-4" />Fichier CSV/VCF</TabsTrigger>
              <TabsTrigger value="paste" className="gap-2"><ClipboardList className="h-4 w-4" />Copier-coller</TabsTrigger>
              <TabsTrigger value="share" className="gap-2"><Link2 className="h-4 w-4" />Lien partagé</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-border hover:border-orange-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                {isDragActive ? (
                  <p className="font-medium text-orange-600">Déposez le fichier ici</p>
                ) : (
                  <>
                    <p className="font-medium mb-1">Glissez-déposez votre fichier ici</p>
                    <p className="text-sm text-muted-foreground mb-3">ou cliquez pour parcourir</p>
                    <div className="flex justify-center gap-2">
                      <Badge variant="secondary">CSV</Badge>
                      <Badge variant="secondary">VCF (iPhone/Android)</Badge>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Exportez vos contacts depuis Gmail (CSV), iCloud.com (VCF), ou tout gestionnaire de contacts.
              </p>
            </TabsContent>

            <TabsContent value="paste" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Collez une liste d&apos;emails ou des adresses au format <code className="bg-muted px-1 rounded">Nom &lt;email@example.com&gt;</code>
              </p>
              <textarea
                className="w-full h-36 border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={"jean.dupont@gmail.com\nmarie.martin@orange.fr\n\"Paul Durand\" <paul@example.com>"}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button onClick={handleParsePaste} disabled={!pasteText.trim()} className="w-full">
                Analyser les emails
              </Button>
            </TabsContent>

            <TabsContent value="share" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Collez le lien de partage reçu d&apos;un autre organisateur.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://concert-chaussettes.vercel.app/import-contacts/abc123..."
                  value={shareToken}
                  onChange={(e) => { setShareToken(e.target.value); setShareError(""); }}
                />
                <Button onClick={handlePreviewShare} disabled={!shareToken.trim() || shareLoading}>
                  {shareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vérifier"}
                </Button>
              </div>
              {shareError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {shareError}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-medium">
                  {source === "import_partage"
                    ? `${contactCount} contacts partagés par ${sharePreview?.organisateurNom}`
                    : `${contactCount} contacts détectés`}
                </p>
                {skippedCount > 0 && (
                  <p className="text-sm text-muted-foreground">{skippedCount} entrées ignorées (email invalide)</p>
                )}
              </div>
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Nom</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    {source !== "import_partage" && <th className="px-3 py-2 text-left font-medium">Téléphone</th>}
                  </tr>
                </thead>
                <tbody>
                  {source === "import_partage"
                    ? sharePreview?.preview.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{c.nom}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.emailMasked}</td>
                        </tr>
                      ))
                    : parsedContacts.slice(0, 5).map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{c.nom || <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-3 py-2">{c.email}</td>
                          <td className="px-3 py-2">{c.telephone || <span className="text-muted-foreground">—</span>}</td>
                        </tr>
                      ))}
                  {contactCount > 5 && (
                    <tr className="border-t">
                      <td colSpan={3} className="px-3 py-2 text-center text-muted-foreground text-xs">
                        + {contactCount - 5} autres contacts...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Duplicate handling */}
            {source !== "import_partage" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">En cas de doublon (même email) :</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="dup" value="ignore" checked={onDuplicate === "ignore"} onChange={() => setOnDuplicate("ignore")} />
                    <span className="text-sm">Ignorer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="dup" value="update" checked={onDuplicate === "update"} onChange={() => setOnDuplicate("update")} />
                    <span className="text-sm">Mettre à jour (nom, téléphone)</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
              <Button onClick={handleImport} disabled={importing} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Import en cours...</>
                ) : (
                  `Importer ${contactCount} contacts`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result !== null && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Import terminé !</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Nouveaux contacts</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">Mis à jour</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Ignorés</p>
              </div>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full">Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
