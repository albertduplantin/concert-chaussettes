import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Mail, Phone, UserPlus, Sparkles, Star } from "lucide-react";
import { ContactsActions } from "@/components/contacts/contacts-actions";

export default async function ContactsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true },
  });

  if (!organisateur) redirect("/");

  const allContacts = await db.query.contacts.findMany({
    where: eq(contacts.organisateurId, organisateur.id),
    columns: {
      id: true, nom: true, email: true, telephone: true,
      tags: true, nombreParticipations: true, updatedAt: true,
    },
    with: {
      dernierConcert: { columns: { id: true, titre: true } },
    },
    orderBy: [desc(contacts.updatedAt)],
  });

  // Stats
  const totalContacts = allContacts.length;
  const regularAttendees = allContacts.filter((c) => c.nombreParticipations >= 2).length;
  const totalParticipations = allContacts.reduce((sum, c) => sum + c.nombreParticipations, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Carnet d'adresses
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Mes contacts</h1>
          <p className="text-white/90 max-w-xl">
            Retrouvez toutes les personnes qui ont participé à vos concerts.
            Contactez-les facilement pour vos prochains événements.
          </p>
          <div className="mt-4">
            <ContactsActions contactsCount={totalContacts} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalContacts}</p>
                <p className="text-xs text-muted-foreground">Contacts total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{regularAttendees}</p>
                <p className="text-xs text-muted-foreground">Habitués (2+ concerts)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParticipations}</p>
                <p className="text-xs text-muted-foreground">Participations total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts list */}
      {allContacts.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun contact</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Votre carnet de contacts est vide. Les personnes qui s'inscriront à vos concerts apparaîtront ici automatiquement.
          </p>
        </Card>
      ) : (
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
                {allContacts.map((contact) => (
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
