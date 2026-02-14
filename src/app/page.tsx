export const revalidate = 300;

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSearch } from "@/components/home/hero-search";
import { TrustStats } from "@/components/home/trust-stats";
import { FeaturedGroups } from "@/components/home/featured-groups";
import { Testimonials } from "@/components/home/testimonials";
import {
  Music,
  Guitar,
  Home,
  Mail,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Heart,
  Mic2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Design moderne avec gradient */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 py-20 md:py-32">
          {/* Éléments décoratifs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-800/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 dark:bg-amber-800/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-4xl text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                La musique live, chez vous
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Des concerts intimes,
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  dans votre salon.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Trouvez le groupe parfait pour votre événement privé.
                Des artistes locaux, une ambiance unique, des souvenirs inoubliables.
              </p>
            </div>

            {/* Barre de recherche intégrée */}
            <HeroSearch />

            {/* Double navigation claire */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <p className="text-sm text-muted-foreground">ou inscrivez-vous :</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild className="gap-2 border-2">
                  <Link href="/register?role=ORGANISATEUR">
                    <Home className="h-4 w-4" />
                    Je suis organisateur
                  </Link>
                </Button>
                <Button variant="outline" asChild className="gap-2 border-2">
                  <Link href="/register?role=GROUPE">
                    <Guitar className="h-4 w-4" />
                    Je suis un groupe
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats de confiance */}
        <TrustStats />

        {/* Comment ça marche */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Trois étapes simples pour organiser votre concert privé
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="relative">
                <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm">
                      1
                    </div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                      <Guitar className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      Explorez les artistes
                    </h3>
                    <p className="text-muted-foreground">
                      Parcourez les profils des groupes, écoutez leur musique et regardez leurs vidéos.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative">
                <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm">
                      2
                    </div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                      <Mail className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      Contactez-les
                    </h3>
                    <p className="text-muted-foreground">
                      Envoyez une demande directe. Discutez des détails, du répertoire et du cachet.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative">
                <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm">
                      3
                    </div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                      <Music className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      Vivez le concert
                    </h3>
                    <p className="text-muted-foreground">
                      Invitez vos proches et profitez d'une soirée musicale unique et intime.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Groupes en vedette */}
        <FeaturedGroups />

        {/* Double section Organisateurs / Groupes */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Pour les organisateurs */}
              <Card className="p-8 border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Pour les organisateurs</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Découvrez les groupes de votre région</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Créez une page événement pour chaque concert</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Gérez les inscriptions avec jauge automatique</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Invitez facilement par email, SMS ou WhatsApp</span>
                  </li>
                </ul>
                <Button asChild className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  <Link href="/register?role=ORGANISATEUR">
                    Créer mon compte organisateur
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>

              {/* Pour les groupes */}
              <Card className="p-8 border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                    <Mic2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Pour les groupes</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Créez votre vitrine avec bio, photos et vidéos</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Soyez découvert par des organisateurs locaux</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Jouez dans des lieux intimes et chaleureux</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>Rencontrez un public passionné</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full gap-2 border-2">
                  <Link href="/register?role=GROUPE">
                    Inscrire mon groupe
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <Testimonials />

        {/* CTA final */}
        <section className="py-20 bg-gradient-to-br from-orange-500 to-amber-500">
          <div className="container mx-auto px-4 text-center">
            <Heart className="h-12 w-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Prêt à vivre la musique autrement ?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Rejoignez Concert Chaussettes et participez à l'aventure
              des concerts privés chez l'habitant.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="gap-2 px-8 bg-white text-orange-600 hover:bg-white/90">
                <Link href="/register">
                  S'inscrire gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">Déjà un compte ? Se connecter</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
