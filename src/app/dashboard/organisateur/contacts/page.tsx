import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Mail, Phone } from "lucide-react";

export default async function ContactsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
  });

  if (!organisateur) redirect("/");

  const allContacts = await db.query.contacts.findMany({
    where: eq(contacts.organisateurId, organisateur.id),
    with: {
      dernierConcert: true,
    },
    orderBy: [desc(contacts.updatedAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes contacts</h1>
        <p className="text-muted-foreground mt-1">
          {allContacts.length} contact{allContacts.length !== 1 ? "s" : ""} dans
          votre carnet
        </p>
      </div>

      {allContacts.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Votre carnet de contacts est vide. Les personnes qui s&apos;inscriront
            &agrave; vos concerts appara&icirc;tront ici automatiquement.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>T&eacute;l&eacute;phone</TableHead>
                  <TableHead>Participations</TableHead>
                  <TableHead>Dernier concert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.nom || "—"}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {contact.telephone ? (
                        <a
                          href={`tel:${contact.telephone}`}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.telephone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
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
