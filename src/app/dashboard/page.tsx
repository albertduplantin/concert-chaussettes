import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardRedirect() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "GROUPE") {
    redirect("/dashboard/groupe");
  } else if (session.user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard/organisateur");
  }
}
