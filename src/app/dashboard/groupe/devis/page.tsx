import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, demandesDevis } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DevisList } from "./devis-list";
import { FileText, Sparkles } from "lucide-react";

export default async function GroupeDevisPage() {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    redirect("/");
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: { id: true },
  });

  if (!groupe) redirect("/");

  const devis = await db.query.demandesDevis.findMany({
    where: eq(demandesDevis.groupeId, groupe.id),
    orderBy: [desc(demandesDevis.createdAt)],
  });

  const unreadCount = devis.filter((d) => !d.isRead).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Demandes reçues
            </span>
            {unreadCount > 0 && (
              <span className="text-sm font-bold bg-white text-orange-600 px-3 py-1 rounded-full">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Demandes de devis</h1>
          <p className="text-white/90 max-w-xl">
            Les organisateurs intéressés par votre groupe vous ont contacté ici.
            Répondez-leur directement par email.
          </p>
        </div>
      </div>

      <DevisList devis={devis} />
    </div>
  );
}
