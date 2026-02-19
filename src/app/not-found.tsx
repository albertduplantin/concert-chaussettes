import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Music, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-8">
            <Music className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-3">Page introuvable</h2>
          <p className="text-muted-foreground mb-8">
            Cette page n&apos;existe pas ou a été déplacée. Peut-être cherchez-vous un groupe ou un concert ?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/groupes">
                <Search className="h-4 w-4 mr-2" />
                Trouver un groupe
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
