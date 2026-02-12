import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingOrganisateurWizard } from "./wizard";

export default async function OnboardingOrganisateurPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/onboarding/role");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true, nom: true, ville: true, bio: true, thumbnailUrl: true },
  });

  if (!organisateur) {
    redirect("/onboarding/role");
  }

  // Si le profil est déjà renseigné (ville existante = déjà passé par là), aller au dashboard
  if (organisateur.ville) {
    redirect("/dashboard/organisateur");
  }

  return (
    <OnboardingOrganisateurWizard
      defaultNom={organisateur.nom ?? ""}
    />
  );
}
