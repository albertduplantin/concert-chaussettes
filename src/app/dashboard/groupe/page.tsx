import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, genres, groupeGenres, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GroupeProfileForm } from "@/components/forms/groupe-profile-form";

export default async function GroupeDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    redirect("/");
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    with: {
      groupeGenres: {
        with: {
          genre: true,
        },
      },
    },
  });

  if (!groupe) {
    redirect("/");
  }

  const allGenres = await db.query.genres.findMany({
    orderBy: (genres, { asc }) => [asc(genres.nom)],
  });

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const isPremium = subscription?.plan === "PREMIUM";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon profil de groupe</h1>
        <p className="text-muted-foreground mt-1">
          Compl&eacute;tez votre profil pour &ecirc;tre visible par les organisateurs
        </p>
      </div>

      <GroupeProfileForm
        groupe={{
          id: groupe.id,
          nom: groupe.nom,
          bio: groupe.bio,
          photos: groupe.photos ?? [],
          youtubeVideos: groupe.youtubeVideos ?? [],
          ville: groupe.ville,
          codePostal: groupe.codePostal,
          departement: groupe.departement,
          region: groupe.region,
          contactEmail: groupe.contactEmail,
          contactTel: groupe.contactTel,
          contactSite: groupe.contactSite,
          genres: groupe.groupeGenres.map((gg) => gg.genre.id),
        }}
        allGenres={allGenres}
        isPremium={isPremium}
      />
    </div>
  );
}
