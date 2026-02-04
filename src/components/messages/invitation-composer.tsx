"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Copy,
  Mail,
  MessageSquare,
  Phone,
  Check,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  nom: string;
  sujet: string | null;
  contenu: string;
  type: "EMAIL" | "SMS" | "WHATSAPP";
  isDefault?: boolean;
}

interface Contact {
  id: string;
  nom: string | null;
  email: string;
  telephone: string | null;
}

interface Concert {
  id: string;
  titre: string;
  description: string | null;
  date: string;
  adresseComplete: string | null;
  adressePublique: string | null;
  ville: string | null;
  slug: string;
}

interface InvitationComposerProps {
  concert: Concert;
  organisateurNom: string;
  contacts?: Contact[];
}

type ChannelType = "EMAIL" | "SMS" | "WHATSAPP";

export function InvitationComposer({
  concert,
  organisateurNom,
  contacts: initialContacts = [],
}: InvitationComposerProps) {
  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeChannel, setActiveChannel] = useState<ChannelType>("EMAIL");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Load templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/messages/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates);
        }
      } catch {
        console.error("Erreur chargement templates");
      }
    }
    fetchTemplates();
  }, []);

  // Load contacts if not provided
  useEffect(() => {
    if (initialContacts.length === 0) {
      async function fetchContacts() {
        setIsLoadingContacts(true);
        try {
          const res = await fetch("/api/organisateur/contacts");
          if (res.ok) {
            const data = await res.json();
            setContacts(data.contacts || []);
          }
        } catch {
          console.error("Erreur chargement contacts");
        } finally {
          setIsLoadingContacts(false);
        }
      }
      fetchContacts();
    }
  }, [initialContacts]);

  // Filter templates by channel
  const filteredTemplates = templates.filter((t) => t.type === activeChannel);

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.nom?.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.telephone?.includes(query)
    );
  }, [contacts, searchQuery]);

  // Selected contacts
  const selectedContacts = useMemo(() => {
    return contacts.filter((c) => selectedContactIds.has(c.id));
  }, [contacts, selectedContactIds]);

  // Generate recipients string
  const recipientsString = useMemo(() => {
    if (activeChannel === "EMAIL") {
      return selectedContacts.map((c) => c.email).join(", ");
    } else {
      return selectedContacts
        .filter((c) => c.telephone)
        .map((c) => c.telephone)
        .join(", ");
    }
  }, [selectedContacts, activeChannel]);

  // Generate message with replacements
  function generateMessage(template: Template, recipientName?: string) {
    const date = new Date(concert.date);
    const dateStr = format(date, "EEEE d MMMM yyyy", { locale: fr });
    const heureStr = format(date, "HH:mm", { locale: fr });
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const replacements: Record<string, string> = {
      "{{titre_concert}}": concert.titre,
      "{{date_concert}}": dateStr,
      "{{heure_concert}}": heureStr,
      "{{ville_concert}}": concert.ville || "A definir",
      "{{adresse_complete}}": concert.adresseComplete || concert.adressePublique || "A definir",
      "{{description_concert}}": concert.description || "",
      "{{lien_inscription}}": `${baseUrl}/concert/${concert.slug}`,
      "{{nom_organisateur}}": organisateurNom,
      "{{prenom}}": recipientName || "[Prenom]",
    };

    let message = template.contenu;
    let subject = template.sujet || "";

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
      message = message.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    setGeneratedMessage(message);
    setGeneratedSubject(subject);
    setCustomMessage(message);
    setSelectedTemplate(template);
  }

  // Copy to clipboard
  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copie !");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  }

  // Generate Gmail URL
  function getGmailUrl() {
    const emails = selectedContacts.map((c) => c.email).join(",");
    const subject = encodeURIComponent(generatedSubject);
    const body = encodeURIComponent(customMessage || generatedMessage);
    return `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=${emails}&su=${subject}&body=${body}`;
  }

  // Generate WhatsApp URL (single recipient)
  function getWhatsAppUrl(phone?: string) {
    const message = encodeURIComponent(customMessage || generatedMessage);
    if (phone) {
      // Format phone for WhatsApp (remove spaces, +, etc.)
      const cleanPhone = phone.replace(/[\s+\-()]/g, "");
      return `https://wa.me/${cleanPhone}?text=${message}`;
    }
    return `https://wa.me/?text=${message}`;
  }

  // Generate SMS URL
  function getSmsUrl(phone?: string) {
    const message = encodeURIComponent(customMessage || generatedMessage);
    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? "&" : "?";
    if (phone) {
      return `sms:${phone}${separator}body=${message}`;
    }
    return `sms:${separator}body=${message}`;
  }

  // Toggle contact selection
  function toggleContact(contactId: string) {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  }

  // Select all filtered contacts
  function selectAllContacts() {
    const newSelected = new Set(selectedContactIds);
    filteredContacts.forEach((c) => newSelected.add(c.id));
    setSelectedContactIds(newSelected);
  }

  // Deselect all
  function deselectAllContacts() {
    setSelectedContactIds(new Set());
  }

  // Convert HTML to plain text
  function htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }

  // Convert plain text to HTML
  function plainTextToHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
  }

  const messageToUse = customMessage || generatedMessage;

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Send className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <span className="text-lg">Envoyer les invitations</span>
            <p className="text-sm font-normal text-muted-foreground mt-0.5">
              Preparez vos messages et copiez-les dans Gmail, WhatsApp ou SMS
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Channel Tabs */}
        <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as ChannelType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="EMAIL" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="SMS" className="gap-2">
              <Phone className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="WHATSAPP" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeChannel} className="space-y-6 mt-6">
            {/* Step 1: Select Contacts */}
            <div className="space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowContacts(!showContacts)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-sm font-bold">
                    1
                  </div>
                  <Label className="text-base font-medium cursor-pointer">
                    Selectionner les destinataires
                  </Label>
                  {selectedContactIds.size > 0 && (
                    <Badge variant="secondary">{selectedContactIds.size} selectionne(s)</Badge>
                  )}
                </div>
                {showContacts ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {showContacts && (
                <div className="border rounded-lg p-4 space-y-3">
                  {/* Search and actions */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllContacts}
                      disabled={filteredContacts.length === 0}
                    >
                      Tout selectionner
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllContacts}
                      disabled={selectedContactIds.size === 0}
                    >
                      Deselectionner
                    </Button>
                  </div>

                  {/* Contact list */}
                  {isLoadingContacts ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Chargement des contacts...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-muted-foreground">Aucun contact</p>
                      <p className="text-sm text-muted-foreground">
                        Ajoutez des contacts dans votre CRM pour les inviter
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {filteredContacts.map((contact) => {
                          const isSelected = selectedContactIds.has(contact.id);
                          const hasRequiredInfo =
                            activeChannel === "EMAIL"
                              ? !!contact.email
                              : !!contact.telephone;

                          return (
                            <div
                              key={contact.id}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-orange-50 dark:bg-orange-900/20"
                                  : "hover:bg-muted/50",
                                !hasRequiredInfo && "opacity-50"
                              )}
                              onClick={() => hasRequiredInfo && toggleContact(contact.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={!hasRequiredInfo}
                                onCheckedChange={() => toggleContact(contact.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {contact.nom || contact.email}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {activeChannel === "EMAIL"
                                    ? contact.email
                                    : contact.telephone || "Pas de telephone"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Step 2: Choose Template */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-sm font-bold">
                  2
                </div>
                <Label className="text-base font-medium">Choisir un modele</Label>
              </div>

              <Select
                onValueChange={(id) => {
                  const template = templates.find((t) => t.id === id);
                  if (template) generateMessage(template);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un modele..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Aucun modele pour ce canal
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {template.nom}
                          {template.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Defaut
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Step 3: Copy Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-sm font-bold">
                  3
                </div>
                <Label className="text-base font-medium">Copier les champs</Label>
              </div>

              {/* Recipients field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Destinataires ({selectedContactIds.size})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(recipientsString, "recipients")}
                    disabled={!recipientsString}
                    className="gap-1.5 h-8"
                  >
                    {copiedField === "recipients" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copier
                  </Button>
                </div>
                <Input
                  value={recipientsString || "Selectionnez des contacts ci-dessus"}
                  readOnly
                  className="bg-muted text-sm"
                />
              </div>

              {/* Subject field (email only) */}
              {activeChannel === "EMAIL" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Objet</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedSubject, "subject")}
                      disabled={!generatedSubject}
                      className="gap-1.5 h-8"
                    >
                      {copiedField === "subject" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copier
                    </Button>
                  </div>
                  <Input
                    value={generatedSubject || "Selectionnez un modele"}
                    readOnly
                    className="bg-muted text-sm"
                  />
                </div>
              )}

              {/* Message field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground">Message</Label>
                    {activeChannel === "EMAIL" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Texte</span>
                        <Switch
                          checked={isHtmlMode}
                          onCheckedChange={setIsHtmlMode}
                          className="scale-75"
                        />
                        <span className="text-xs text-muted-foreground">HTML</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = isHtmlMode ? plainTextToHtml(messageToUse) : messageToUse;
                      copyToClipboard(text, "message");
                    }}
                    disabled={!messageToUse}
                    className="gap-1.5 h-8"
                  >
                    {copiedField === "message" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copier
                  </Button>
                </div>
                <Textarea
                  value={
                    messageToUse
                      ? isHtmlMode
                        ? plainTextToHtml(messageToUse)
                        : messageToUse
                      : "Selectionnez un modele"
                  }
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Le message apparaitra ici..."
                />
              </div>
            </div>

            <Separator />

            {/* Step 4: Send Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-sm font-bold">
                  4
                </div>
                <Label className="text-base font-medium">Envoyer</Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeChannel === "EMAIL" && (
                  <>
                    <Button
                      onClick={() => window.open(getGmailUrl(), "_blank")}
                      disabled={selectedContactIds.size === 0 || !messageToUse}
                      className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    >
                      <Mail className="h-4 w-4" />
                      Ouvrir dans Gmail
                      <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const mailto = `mailto:${recipientsString}?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(messageToUse)}`;
                        window.location.href = mailto;
                      }}
                      disabled={selectedContactIds.size === 0 || !messageToUse}
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Ouvrir dans Mail
                    </Button>
                  </>
                )}

                {activeChannel === "WHATSAPP" && (
                  <>
                    {selectedContacts.length === 1 && selectedContacts[0].telephone ? (
                      <Button
                        onClick={() => window.open(getWhatsAppUrl(selectedContacts[0].telephone!), "_blank")}
                        disabled={!messageToUse}
                        className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Envoyer a {selectedContacts[0].nom || selectedContacts[0].telephone}
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => window.open(getWhatsAppUrl(), "_blank")}
                        disabled={!messageToUse}
                        className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ouvrir WhatsApp
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground col-span-full">
                      WhatsApp ne permet d&apos;envoyer qu&apos;a un destinataire a la fois.
                      Selectionnez un contact ou copiez le message pour l&apos;envoyer manuellement.
                    </p>
                  </>
                )}

                {activeChannel === "SMS" && (
                  <>
                    {selectedContacts.length === 1 && selectedContacts[0].telephone ? (
                      <Button
                        onClick={() => window.location.href = getSmsUrl(selectedContacts[0].telephone!)}
                        disabled={!messageToUse}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        <Phone className="h-4 w-4" />
                        Envoyer a {selectedContacts[0].nom || selectedContacts[0].telephone}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(messageToUse, "message")}
                        disabled={!messageToUse}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copier le message
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground col-span-full">
                      SMS fonctionne mieux sur mobile. Copiez le message et les numeros
                      pour les coller dans Google Messages ou votre app SMS.
                    </p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
