import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardRedirect() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Rediriger les utilisateurs OAuth qui n'ont pas encore choisi leur rôle
  if (session.user.needsOnboarding) {
    redirect("/onboarding/role");
  }

  if (session.user.role === "GROUPE") {
    redirect("/dashboard/groupe");
  } else if (session.user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard/organisateur");
  }
}
