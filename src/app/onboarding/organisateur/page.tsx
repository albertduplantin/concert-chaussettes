import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, genres } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { OnboardingOrganisateurWizard } from "./wizard";

export default async function OnboardingOrganisateurPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/onboarding/role");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true, nom: true, ville: true },
  });

  if (!organisateur) {
    redirect("/onboarding/role");
  }

  // Si le profil est déjà renseigné (ville existante = déjà passé par là), aller au dashboard
  if (organisateur.ville) {
    redirect("/dashboard/organisateur");
  }

  // Charger les genres pour l'étape "goûts musicaux"
  const allGenres = await db
    .select({ id: genres.id, nom: genres.nom })
    .from(genres)
    .where(eq(genres.isCustom, false))
    .orderBy(asc(genres.nom));

  return (
    <OnboardingOrganisateurWizard
      defaultNom={organisateur.nom ?? ""}
      genres={allGenres}
    />
  );
}
