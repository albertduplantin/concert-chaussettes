import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, concerts, inscriptions, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Users, ExternalLink, Pencil } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusColors: Record<string, string> = {
  BROUILLON: "bg-gray-100 text-gray-800",
  PUBLIE: "bg-green-100 text-green-800",
  PASSE: "bg-blue-100 text-blue-800",
  ANNULE: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publié",
  PASSE: "Passé",
  ANNULE: "Annulé",
};

export default async function ConcertsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
  });

  if (!organisateur) redirect("/");

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });
  const isPremium = subscription?.plan === "PREMIUM";

  const allConcerts = await db.query.concerts.findMany({
    where: eq(concerts.organisateurId, organisateur.id),
    with: {
      groupe: true,
      inscriptions: true,
    },
    orderBy: [desc(concerts.date)],
  });

  const currentYear = new Date().getFullYear();
  const concertsThisYear = allConcerts.filter(
    (c) => new Date(c.date).getFullYear() === currentYear
  );
  const maxConcerts = isPremium ? Infinity : 3;
  const canCreate = concertsThisYear.length < maxConcerts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes concerts</h1>
          {!isPremium && (
            <p className="text-sm text-muted-foreground mt-1">
              {concertsThisYear.length}/{maxConcerts} concerts cette ann&eacute;e (gratuit)
            </p>
          )}
        </div>
        {canCreate ? (
          <Button asChild className="gap-2">
            <Link href="/dashboard/organisateur/concerts/new">
              <Plus className="h-4 w-4" />
              Nouveau concert
            </Link>
          </Button>
        ) : (
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" />
            Limite atteinte
          </Button>
        )}
      </div>

      {allConcerts.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore cr&eacute;&eacute; de concert.
          </p>
          {canCreate && (
            <Button asChild className="mt-4 gap-2">
              <Link href="/dashboard/organisateur/concerts/new">
                <Plus className="h-4 w-4" />
                Cr&eacute;er mon premier concert
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {allConcerts.map((concert) => {
            const confirmedCount = concert.inscriptions
              .filter((i) => i.status === "CONFIRME")
              .reduce((sum, i) => sum + i.nombrePersonnes, 0);

            return (
              <Card key={concert.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{concert.titre}</h3>
                      <Badge className={statusColors[concert.status]}>
                        {statusLabels[concert.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(concert.date), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {confirmedCount}
                        {concert.maxInvites
                          ? `/${concert.maxInvites}`
                          : ""}{" "}
                        inscrits
                      </span>
                      {concert.groupe && (
                        <span>Groupe : {concert.groupe.nom}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {concert.status === "PUBLIE" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/concert/${concert.slug}`}
                          target="_blank"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Page publique
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/organisateur/concerts/${concert.id}/edit`}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/organisateur/concerts/${concert.id}`}
                      >
                        G&eacute;rer
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
