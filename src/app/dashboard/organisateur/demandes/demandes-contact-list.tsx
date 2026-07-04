"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, Mail, Phone, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Demande {
  id: string;
  message: string;
  dateSouhaitee: Date | null;
  isRead: boolean;
  createdAt: Date;
  groupe: {
    id: string;
    nom: string;
    thumbnailUrl: string | null;
    contactEmail: string | null;
    contactTel: string | null;
  };
}

export function DemandesContactList({ demandes }: { demandes: Demande[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(demandes.filter((d) => d.isRead).map((d) => d.id))
  );

  async function markAsRead(id: string) {
    if (readIds.has(id)) return;
    await fetch("/api/organisateur/demandes-contact", {
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

  if (demandes.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
            <Mic2 className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune demande reçue</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Quand des groupes rempliront le formulaire de contact sur votre profil public, les demandes apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {demandes.map((d) => {
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
              <button className="w-full flex items-start gap-4 text-left" onClick={() => toggleExpand(d.id)}>
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
                    <Link href={`/groupes/${d.groupe.id}`} className="font-semibold hover:text-orange-600" onClick={(e) => e.stopPropagation()}>
                      {d.groupe.nom}
                    </Link>
                    {!isRead && <Badge className="bg-orange-500 text-white border-0 text-xs">Nouveau</Badge>}
                  </div>
                  {d.dateSouhaitee && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(d.dateSouhaitee), "d MMMM yyyy", { locale: fr })}
                    </span>
                  )}
                </div>

                <div className="flex-shrink-0 text-muted-foreground">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Message</p>
                    <p className="whitespace-pre-line">{d.message}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {d.groupe.contactEmail && (
                      <Button size="sm" asChild>
                        <a href={`mailto:${d.groupe.contactEmail}?subject=Réponse à votre demande de concert`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Répondre par email
                        </a>
                      </Button>
                    )}
                    {d.groupe.contactTel && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${d.groupe.contactTel}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {d.groupe.contactTel}
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
