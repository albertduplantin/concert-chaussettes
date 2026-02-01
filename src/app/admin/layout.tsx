import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Music2,
  Settings,
  Shield,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Only admins can access
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-muted/30 flex-col p-4 gap-1">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <Shield className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-orange-600">Administration</span>
          </div>

          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/admin/users">
              <Users className="h-4 w-4" />
              Utilisateurs
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/admin/groupes">
              <Music2 className="h-4 w-4" />
              Groupes
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/admin/settings">
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>
          </Button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto bg-muted/10">{children}</main>
      </div>
    </div>
  );
}
