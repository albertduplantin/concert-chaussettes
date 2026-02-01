import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FloatingCTA } from "@/components/ui/floating-cta";
import { Search, CalendarDays, Users, Mail } from "lucide-react";

export default function OrganisateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-muted/30 flex-col p-4 gap-1">
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/dashboard/organisateur">
              <Search className="h-4 w-4" />
              Rechercher des groupes
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/dashboard/organisateur/concerts">
              <CalendarDays className="h-4 w-4" />
              Mes concerts
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/dashboard/organisateur/contacts">
              <Users className="h-4 w-4" />
              Mes contacts
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" asChild>
            <Link href="/dashboard/organisateur/messages">
              <Mail className="h-4 w-4" />
              Templates messages
            </Link>
          </Button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      {/* Floating CTA */}
      <FloatingCTA />
    </div>
  );
}
