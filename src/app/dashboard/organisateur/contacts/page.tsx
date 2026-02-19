import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Sparkles, Star } from "lucide-react";
import { ContactsActions } from "@/components/contacts/contacts-actions";
import { ContactsTable } from "@/components/contacts/contacts-table";

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

      <ContactsTable contacts={allContacts} />
    </div>
  );
}
