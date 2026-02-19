"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Mail, Phone, Search, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  nom: string | null;
  email: string;
  telephone: string | null;
  tags: string[] | null;
  nombreParticipations: number;
  updatedAt: Date | null;
  dernierConcert: { id: string; titre: string } | null;
}

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState("");
  const [filterFidele, setFilterFidele] = useState(false);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (filterFidele && c.nombreParticipations < 2) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.nom?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.telephone?.includes(q) ||
          c.dernierConcert?.titre.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, search, filterFidele]);

  if (contacts.length === 0) {
    return (
      <Card className="p-12 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun contact</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Votre carnet de contacts est vide. Les personnes qui s&apos;inscriront à vos concerts apparaîtront ici automatiquement.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, concert..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterFidele(!filterFidele)}
          className={cn(
            "gap-2 h-10",
            filterFidele && "bg-purple-50 dark:bg-purple-950/20 border-purple-400 text-purple-700 dark:text-purple-300"
          )}
        >
          <Star className="h-4 w-4" />
          Habitués uniquement
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
        {filtered.length !== contacts.length && ` sur ${contacts.length}`}
      </p>

      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Nom</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Téléphone</TableHead>
                <TableHead className="font-semibold text-center">Participations</TableHead>
                <TableHead className="font-semibold">Dernier concert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun résultat pour &quot;{search}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {contact.nom || "—"}
                        {contact.nombreParticipations >= 3 && (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0 text-xs">
                            Fidèle
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-orange-600 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {contact.telephone ? (
                        <a
                          href={`tel:${contact.telephone}`}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-orange-600 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {contact.telephone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={
                          contact.nombreParticipations >= 2
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0"
                            : ""
                        }
                      >
                        {contact.nombreParticipations}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.dernierConcert?.titre || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
