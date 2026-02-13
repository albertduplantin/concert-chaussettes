import { Music, Users, Star, CalendarCheck } from "lucide-react";
import { db } from "@/lib/db";
import { groupes, concerts, avis, inscriptions } from "@/lib/db/schema";
import { count, avg, eq } from "drizzle-orm";

interface StatProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function Stat({ icon, value, label }: StatProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="text-3xl md:text-4xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export async function TrustStats() {
  const [groupeCount] = await db.select({ total: count() }).from(groupes);
  const [concertCount] = await db.select({ total: count() }).from(concerts);
  const [inscriptionCount] = await db.select({ total: count() }).from(inscriptions);
  const [avgRating] = await db
    .select({ avg: avg(avis.note) })
    .from(avis)
    .where(eq(avis.isVisible, true));

  const rating = avgRating?.avg ? parseFloat(Number(avgRating.avg).toFixed(1)) : null;

  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <Stat
            icon={<Music className="h-8 w-8" />}
            value={`${groupeCount.total}+`}
            label="Groupes inscrits"
          />
          <Stat
            icon={<CalendarCheck className="h-8 w-8" />}
            value={`${concertCount.total}+`}
            label="Concerts organisés"
          />
          <Stat
            icon={<Users className="h-8 w-8" />}
            value={`${inscriptionCount.total}+`}
            label="Participants"
          />
          <Stat
            icon={<Star className="h-8 w-8" />}
            value={rating ? `${rating}` : "—"}
            label="Note moyenne"
          />
        </div>
      </div>
    </section>
  );
}
