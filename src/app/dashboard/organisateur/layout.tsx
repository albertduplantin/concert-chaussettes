"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FloatingCTA } from "@/components/ui/floating-cta";
import {
  Search,
  CalendarDays,
  Users,
  Mail,
  ChevronRight,
  Home,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  {
    href: "/dashboard/organisateur",
    label: "Rechercher des groupes",
    icon: Search,
    exact: true,
  },
  {
    href: "/dashboard/organisateur/concerts",
    label: "Mes concerts",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/organisateur/contacts",
    label: "Mes contacts",
    icon: Users,
  },
  {
    href: "/dashboard/organisateur/messages",
    label: "Templates messages",
    icon: Mail,
  },
];

export default function OrganisateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <Header />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 border-r bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex-col">
          {/* User section */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Espace Organisateur</p>
                <p className="text-xs text-muted-foreground">Gérez vos concerts</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-orange-500"
                  )} />
                  <span className="flex-1">{link.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          {/* Help section */}
          <div className="p-4 border-t">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-sm">Besoin d'aide ?</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Consultez notre guide pour organiser votre premier concert.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/30"
              >
                Voir le guide
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t shadow-lg">
          <nav className="flex justify-around p-2">
            {sidebarLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                    isActive
                      ? "text-orange-600"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{link.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto p-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Floating CTA */}
      <FloatingCTA />
    </div>
  );
}
