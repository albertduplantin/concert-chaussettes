"use client";

import Link from "next/link";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Music, User, LogOut, LayoutDashboard } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  const dashboardPath =
    session?.user?.role === "GROUPE"
      ? "/dashboard/groupe"
      : session?.user?.role === "ADMIN"
        ? "/admin"
        : "/dashboard/organisateur";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Concert Chaussettes</span>
        </Link>

        <nav className="flex items-center gap-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {session.user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={dashboardPath} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Tableau de bord
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await fetch("/api/auth/signout", {
                      method: "POST",
                    });
                    window.location.href = "/";
                  }}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se d&eacute;connecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">S&apos;inscrire</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
