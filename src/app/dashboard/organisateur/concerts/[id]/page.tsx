import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, concerts } from "@/lib/db/schema";
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
  Clock,
  CheckCircle,
  XCircle,
  Music,
  Copy,
} from "lucide-react";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { InvitationComposer } from "@/components/messages/invitation-composer";
import { InscriptionActions, AddInscriptionButton } from "./inscription-actions";

interface ConcertDetailPageProps {
  params: Promise<{ id: string }>;
}

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
  const cancelledInscrits = concert.inscriptions.filter(
    (i) => i.status === "ANNULE"
  );
  const confirmedCount = confirmedInscrits.reduce(
    (sum, i) => sum + i.nombrePersonnes,
    0
  );
  const waitlistCount = waitlistInscrits.reduce(
    (sum, i) => sum + i.nombrePersonnes,
    0
  );

  const concertUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/concert/${concert.slug}`;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    BROUILLON: { label: "Brouillon", color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-800" },
    PUBLIE: { label: "Publie", color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30" },
    PASSE: { label: "Passe", color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30" },
    ANNULE: { label: "Annule", color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30" },
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href="/dashboard/organisateur/concerts">
            <ArrowLeft className="h-4 w-4" />
            Retour aux concerts
          </Link>
        </Button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Music className="h-6 w-6" />
                </div>
                <Badge className={`${statusConfig[concert.status].bg} ${statusConfig[concert.status].color} border-0`}>
                  {statusConfig[concert.status].label}
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{concert.titre}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(concert.date), "EEEE d MMMM yyyy 'a' HH:mm", {
                      locale: fr,
                    })}
                  </span>
                  {concert.ville && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {concert.ville}
                    </span>
                  )}
                  {concert.groupe && (
                    <span className="flex items-center gap-1.5">
                      <Music className="h-4 w-4" />
                      {concert.groupe.nom}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Link href={`/dashboard/organisateur/concerts/${concert.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
              {concert.status === "PUBLIE" && (
                <>
                  <CopyLinkButton url={concertUrl} />
                  <Button
                    size="sm"
                    asChild
                    className="gap-1.5 bg-white text-orange-600 hover:bg-white/90"
                  >
                    <Link href={`/concert/${concert.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      Voir la page
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitlistCount}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {concert.maxInvites || "∞"}
                </p>
                <p className="text-xs text-muted-foreground">Places max</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cancelledInscrits.length}</p>
                <p className="text-xs text-muted-foreground">Annulations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inscrits confirmes */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <span className="text-lg">Inscrits confirmes</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({confirmedInscrits.length} inscriptions, {confirmedCount} personnes)
              </span>
            </div>
          </CardTitle>
          <AddInscriptionButton concertId={concert.id} />
        </CardHeader>
        <CardContent className="p-0">
          {confirmedInscrits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Telephone</TableHead>
                  <TableHead className="font-semibold text-center">Pers.</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedInscrits.map((inscription) => (
                  <TableRow key={inscription.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {inscription.prenom} {inscription.nom}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inscription.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inscription.telephone || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-semibold">
                        {inscription.nombrePersonnes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(
                        new Date(inscription.createdAt),
                        "d MMM yyyy",
                        { locale: fr }
                      )}
                    </TableCell>
                    <TableCell>
                      <InscriptionActions
                        concertId={concert.id}
                        inscription={{
                          id: inscription.id,
                          prenom: inscription.prenom,
                          nom: inscription.nom,
                          email: inscription.email,
                          telephone: inscription.telephone,
                          nombrePersonnes: inscription.nombrePersonnes,
                          status: inscription.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucun inscrit pour le moment</p>
              <p className="text-sm text-muted-foreground mt-1">
                Partagez le lien de votre concert pour recevoir des inscriptions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste d'attente */}
      {waitlistInscrits.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <span className="text-lg">Liste d&apos;attente</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({waitlistInscrits.length} inscriptions, {waitlistCount} personnes)
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Telephone</TableHead>
                  <TableHead className="font-semibold text-center">Pers.</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlistInscrits.map((inscription) => (
                  <TableRow key={inscription.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {inscription.prenom} {inscription.nom}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inscription.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inscription.telephone || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-semibold">
                        {inscription.nombrePersonnes}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <InscriptionActions
                        concertId={concert.id}
                        inscription={{
                          id: inscription.id,
                          prenom: inscription.prenom,
                          nom: inscription.nom,
                          email: inscription.email,
                          telephone: inscription.telephone,
                          nombrePersonnes: inscription.nombrePersonnes,
                          status: inscription.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Inscrits annules */}
      {cancelledInscrits.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden opacity-75">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <span className="text-lg">Annulations</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({cancelledInscrits.length})
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold text-center">Pers.</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledInscrits.map((inscription) => (
                  <TableRow key={inscription.id} className="hover:bg-muted/50 text-muted-foreground">
                    <TableCell className="line-through">
                      {inscription.prenom} {inscription.nom}
                    </TableCell>
                    <TableCell className="text-sm line-through">{inscription.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {inscription.nombrePersonnes}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <InscriptionActions
                        concertId={concert.id}
                        inscription={{
                          id: inscription.id,
                          prenom: inscription.prenom,
                          nom: inscription.nom,
                          email: inscription.email,
                          telephone: inscription.telephone,
                          nombrePersonnes: inscription.nombrePersonnes,
                          status: inscription.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Envoi des invitations */}
      {concert.status === "PUBLIE" && (
        <InvitationComposer
          concert={{
            id: concert.id,
            titre: concert.titre,
            description: concert.description,
            date: concert.date.toISOString(),
            adresseComplete: concert.adresseComplete,
            adressePublique: concert.adressePublique,
            ville: concert.ville,
            slug: concert.slug,
          }}
          organisateurNom={organisateur.nom}
        />
      )}
    </div>
  );
}
