import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, genres } from "@/lib/db/schema";
import { GroupeSearch } from "@/components/groupes/groupe-search";

export default async function OrganisateurDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const allGenres = await db.query.genres.findMany({
    orderBy: (genres, { asc }) => [asc(genres.nom)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rechercher des groupes</h1>
        <p className="text-muted-foreground mt-1">
          Trouvez des groupes dans votre r&eacute;gion pour vos concerts priv&eacute;s
        </p>
      </div>

      <GroupeSearch genres={allGenres} />
    </div>
  );
}
