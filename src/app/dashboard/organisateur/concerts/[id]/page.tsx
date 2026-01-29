import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, concerts, inscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  CalendarDays,
  MapPin,
  Pencil,
} from "lucide-react";
import { CopyLinkButton } from "@/components/ui/copy-link-button";

interface ConcertDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  CONFIRME: "bg-green-100 text-green-800",
  LISTE_ATTENTE: "bg-yellow-100 text-yellow-800",
  ANNULE: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  CONFIRME: "Confirmé",
  LISTE_ATTENTE: "Liste d'attente",
  ANNULE: "Annulé",
};

export default async function ConcertDetailPage({
  params,
}: ConcertDetailPageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
  });

  if (!organisateur) redirect("/");

  const concert = await db.query.concerts.findFirst({
    where: and(
      eq(concerts.id, id),
      eq(concerts.organisateurId, organisateur.id)
    ),
    with: {
      groupe: true,
      inscriptions: {
        orderBy: (inscriptions, { asc }) => [asc(inscriptions.createdAt)],
      },
    },
  });

  if (!concert) notFound();

  const confirmedInscrits = concert.inscriptions.filter(
    (i) => i.status === "CONFIRME"
  );
  const waitlistInscrits = concert.inscriptions.filter(
    (i) => i.status === "LISTE_ATTENTE"
  );
  const confirmedCount = confirmedInscrits.reduce(
    (sum, i) => sum + i.nombrePersonnes,
    0
  );

  const concertUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/concert/${concert.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/organisateur/concerts">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
        </Button>
      </div>

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{concert.titre}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(concert.date), "d MMMM yyyy 'à' HH:mm", {
                locale: fr,
              })}
            </span>
            {concert.ville && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {concert.ville}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {confirmedCount}
              {concert.maxInvites ? `/${concert.maxInvites}` : ""} personnes
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/organisateur/concerts/${concert.id}/edit`}>
              <Pencil className="h-3 w-3 mr-1" />
              Modifier
            </Link>
          </Button>
          {concert.status === "PUBLIE" && (
            <>
              <CopyLinkButton url={concertUrl} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/concert/${concert.slug}`} target="_blank">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Voir la page
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Inscrits confirmés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Inscrits confirm&eacute;s
            <Badge variant="secondary">{confirmedInscrits.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {confirmedInscrits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>T&eacute;l&eacute;phone</TableHead>
                  <TableHead>Personnes</TableHead>
                  <TableHead>Date inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedInscrits.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell className="font-medium">
                      {inscription.nom}
                    </TableCell>
                    <TableCell>{inscription.email}</TableCell>
                    <TableCell>{inscription.telephone || "—"}</TableCell>
                    <TableCell>{inscription.nombrePersonnes}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(
                        new Date(inscription.createdAt),
                        "d MMM yyyy",
                        { locale: fr }
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-4 text-center text-muted-foreground">
              Aucun inscrit pour le moment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Liste d'attente */}
      {waitlistInscrits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Liste d&apos;attente
              <Badge variant="outline">{waitlistInscrits.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>T&eacute;l&eacute;phone</TableHead>
                  <TableHead>Personnes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlistInscrits.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell className="font-medium">
                      {inscription.nom}
                    </TableCell>
                    <TableCell>{inscription.email}</TableCell>
                    <TableCell>{inscription.telephone || "—"}</TableCell>
                    <TableCell>{inscription.nombrePersonnes}</TableCell>
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
