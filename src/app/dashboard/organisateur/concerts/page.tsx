import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, concerts, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CalendarDays,
  Users,
  ExternalLink,
  Pencil,
  Eye,
  Music,
  Sparkles,
  Crown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig: Record<string, { color: string; bg: string }> = {
  BROUILLON: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-800" },
  PUBLIE: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30" },
  PASSE: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30" },
  ANNULE: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30" },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <CalendarDays className="h-6 w-6" />
              </div>
              {!isPremium && (
                <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {concertsThisYear.length}/{maxConcerts} concerts cette année
                </span>
              )}
              {isPremium && (
                <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Premium - Illimité
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mes concerts</h1>
            <p className="text-white/90 max-w-xl">
              Créez et gérez vos concerts privés. Invitez vos proches et suivez les inscriptions.
            </p>
          </div>
          {canCreate ? (
            <Button
              asChild
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-white/90 shadow-lg"
            >
              <Link href="/dashboard/organisateur/concerts/new">
                <Plus className="h-5 w-5" />
                Nouveau concert
              </Link>
            </Button>
          ) : (
            <div className="text-center">
              <Button disabled size="lg" className="gap-2 mb-2">
                <Plus className="h-5 w-5" />
                Limite atteinte
              </Button>
              <p className="text-xs text-white/80">
                Passez Premium pour des concerts illimités
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <CalendarDays className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allConcerts.length}</p>
                <p className="text-xs text-muted-foreground">Total concerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allConcerts.filter((c) => c.status === "PUBLIE").length}
                </p>
                <p className="text-xs text-muted-foreground">Publiés</p>
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
                  {allConcerts.reduce(
                    (sum, c) =>
                      sum +
                      c.inscriptions
                        .filter((i) => i.status === "CONFIRME")
                        .reduce((s, i) => s + i.nombrePersonnes, 0),
                    0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Inscrits total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Music className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(allConcerts.filter((c) => c.groupe).map((c) => c.groupeId)).size}
                </p>
                <p className="text-xs text-muted-foreground">Groupes invités</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Concerts list */}
      {allConcerts.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4">
            <CalendarDays className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun concert</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Vous n'avez pas encore créé de concert. Commencez par trouver un groupe qui vous plaît !
          </p>
          {canCreate && (
            <Button
              asChild
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Link href="/dashboard/organisateur/concerts/new">
                <Plus className="h-4 w-4" />
                Créer mon premier concert
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {allConcerts.map((concert) => {
            const confirmedCount = concert.inscriptions
              .filter((i) => i.status === "CONFIRME")
              .reduce((sum, i) => sum + i.nombrePersonnes, 0);
            const config = statusConfig[concert.status];

            return (
              <Card
                key={concert.id}
                className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
                    {/* Date badge */}
                    <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 shrink-0">
                      <span className="text-2xl font-bold text-orange-600">
                        {format(new Date(concert.date), "d")}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {format(new Date(concert.date), "MMM", { locale: fr })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {concert.titre}
                        </h3>
                        <Badge className={`${config.bg} ${config.color} border-0`}>
                          {statusLabels[concert.status]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 md:hidden">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(concert.date), "d MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {confirmedCount}
                          {concert.maxInvites ? `/${concert.maxInvites}` : ""} inscrits
                        </span>
                        {concert.groupe && (
                          <span className="flex items-center gap-1">
                            <Music className="h-3.5 w-3.5" />
                            {concert.groupe.nom}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {concert.status === "PUBLIE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-1.5"
                        >
                          <Link href={`/concert/${concert.slug}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Page</span>
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <Link
                          href={`/dashboard/organisateur/concerts/${concert.id}/edit`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Modifier</span>
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        asChild
                        className="gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      >
                        <Link
                          href={`/dashboard/organisateur/concerts/${concert.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Gérer</span>
                        </Link>
                      </Button>
                    </div>
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
