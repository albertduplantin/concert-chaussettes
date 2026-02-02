import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { GroupeSearch } from "@/components/groupes/groupe-search";
import { Guitar, Sparkles } from "lucide-react";

export default async function OrganisateurDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const allGenres = await db.query.genres.findMany({
    orderBy: (genres, { asc }) => [asc(genres.nom)],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Guitar className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Explorez les talents
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Trouvez le groupe parfait
          </h1>
          <p className="text-white/90 max-w-xl">
            Parcourez notre catalogue de groupes et artistes disponibles pour vos concerts privés.
            Filtrez par localisation, genre musical et découvrez leurs vidéos.
          </p>
        </div>
      </div>

      {/* Search */}
      <GroupeSearch genres={allGenres} />
    </div>
  );
}
