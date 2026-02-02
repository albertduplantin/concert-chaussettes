import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GroupeProfileWizard } from "@/components/forms/groupe-profile-wizard";

export default async function GroupeOnboardingPage() {
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

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <GroupeProfileWizard
        groupe={{
          id: groupe.id,
          nom: groupe.nom,
          bio: groupe.bio,
          photos: groupe.photos ?? [],
          thumbnailUrl: groupe.thumbnailUrl ?? null,
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
        isPremium={false}
      />
    </div>
  );
}
