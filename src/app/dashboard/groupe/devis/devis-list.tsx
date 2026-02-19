"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Phone, Calendar, Users, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Devis {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  dateSouhaitee: Date;
  nombreInvites: string | null;
  lieu: string;
  typeEvenement: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function DevisList({ devis }: { devis: Devis[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(devis.filter((d) => d.isRead).map((d) => d.id))
  );

  async function markAsRead(id: string) {
    if (readIds.has(id)) return;
    await fetch("/api/groupe/devis", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setReadIds((prev) => new Set([...prev, id]));
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
    markAsRead(id);
  }

  if (devis.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune demande reçue</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Quand des organisateurs rempliront le formulaire de contact sur votre profil, les demandes apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {devis.map((d) => {
        const isRead = readIds.has(d.id);
        const isExpanded = expandedId === d.id;

        return (
          <Card
            key={d.id}
            className={`border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all ${
              !isRead ? "ring-2 ring-orange-400/50" : ""
            }`}
          >
            <CardContent className="p-4">
              {/* Header row */}
              <button
                className="w-full flex items-start gap-4 text-left"
                onClick={() => toggleExpand(d.id)}
              >
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex-shrink-0">
                  <span className="text-xl font-bold text-orange-600">
                    {format(new Date(d.createdAt), "d")}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {format(new Date(d.createdAt), "MMM", { locale: fr })}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold">{d.nom}</span>
                    {!isRead && (
                      <Badge className="bg-orange-500 text-white border-0 text-xs">Nouveau</Badge>
                    )}
                    {d.typeEvenement && (
                      <Badge variant="secondary" className="text-xs">{d.typeEvenement}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(d.dateSouhaitee), "d MMMM yyyy", { locale: fr })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {d.lieu}
                    </span>
                    {d.nombreInvites && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {d.nombreInvites} invités
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-muted-foreground">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {d.message && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Message</p>
                      <p className="whitespace-pre-line">{d.message}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" asChild>
                      <a href={`mailto:${d.email}?subject=Réponse à votre demande de devis`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Répondre par email
                      </a>
                    </Button>
                    {d.telephone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${d.telephone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {d.telephone}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
