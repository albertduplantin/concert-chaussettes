import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GroupeProfileForm } from "@/components/forms/groupe-profile-form";
import { User, Sparkles } from "lucide-react";

export default async function GroupeProfilPage() {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <User className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Votre vitrine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Mon profil</h1>
          <p className="text-white/90 max-w-xl">
            Un profil complet et attractif augmente vos chances d'être contacté.
            Ajoutez des photos, vidéos et une bio engageante.
          </p>
        </div>
      </div>

      <GroupeProfileForm
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
        isPremium={isPremium}
      />
    </div>
  );
}
