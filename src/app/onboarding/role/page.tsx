import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RoleSelectionForm } from "./role-selection-form";

export default async function OnboardingRolePage() {
  const session = await getSession();

  // Si l'utilisateur n'est pas connecté, rediriger vers login
  if (!session) {
    redirect("/login");
  }

  // Si l'utilisateur a déjà complété l'onboarding, rediriger vers son dashboard
  if (!session.user.needsOnboarding) {
    if (session.user.role === "GROUPE") {
      redirect("/dashboard/groupe");
    } else if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard/organisateur");
    }
  }

  return <RoleSelectionForm userName={session.user.name} />;
}
