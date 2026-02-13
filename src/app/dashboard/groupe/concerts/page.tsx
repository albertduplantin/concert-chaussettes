import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, concerts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, { label: string; class: string }> = {
  BROUILLON: { label: "Brouillon", class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  PUBLIE: { label: "Publié", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  PASSE: { label: "Passé", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ANNULE: { label: "Annulé", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default async function GroupeConcertsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    redirect("/");
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: { id: true },
    with: {
      concerts: {
        columns: {
          id: true,
          titre: true,
          date: true,
          ville: true,
          status: true,
          maxInvites: true,
        },
        orderBy: [desc(concerts.date)],
        with: {
          organisateur: { columns: { nom: true } },
          inscriptions: { columns: { id: true } },
        },
      },
    },
  });

  if (!groupe) redirect("/");

  const allConcerts = groupe.concerts || [];
  const upcoming = allConcerts.filter(
    (c) => new Date(c.date) >= new Date() && c.status === "PUBLIE"
  );
  const past = allConcerts.filter(
    (c) => new Date(c.date) < new Date() || c.status === "PASSE" || c.status === "ANNULE"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mes concerts</h1>
        <p className="text-muted-foreground">
          Tous les concerts auxquels vous participez
        </p>
      </div>

      {allConcerts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun concert</h3>
            <p className="text-muted-foreground text-sm">
              Les organisateurs vous contacteront pour vous proposer des concerts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                À venir ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((concert) => (
                  <ConcertCard key={concert.id} concert={concert} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Passés ({past.length})
              </h2>
              <div className="space-y-3 opacity-75">
                {past.map((concert) => (
                  <ConcertCard key={concert.id} concert={concert} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConcertCard({
  concert,
}: {
  concert: {
    id: string;
    titre: string;
    date: Date;
    ville: string | null;
    status: string;
    maxInvites: number | null;
    organisateur: { nom: string | null };
    inscriptions: { id: string }[];
  };
}) {
  const status = statusLabels[concert.status] || statusLabels.BROUILLON;

  return (
    <Card className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex-shrink-0">
          <span className="text-xl font-bold text-orange-600">
            {format(new Date(concert.date), "d")}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase">
            {format(new Date(concert.date), "MMM", { locale: fr })}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate">{concert.titre}</p>
            <Badge className={`text-xs ${status.class}`}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {concert.ville && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {concert.ville}
              </span>
            )}
            {concert.organisateur?.nom && (
              <span>par {concert.organisateur.nom}</span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {concert.inscriptions.length}
              {concert.maxInvites ? `/${concert.maxInvites}` : ""}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
