import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Music,
  Guitar,
  Home,
  Users,
  Mail,
  CalendarDays,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-24 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Des concerts intimes,
                <br />
                <span className="text-primary">chez vous.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Concert Chaussettes met en relation les organisateurs de concerts
                priv&eacute;s et les groupes de musique. Vivez la musique autrement,
                dans l&apos;intimit&eacute; d&apos;un salon.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="gap-2 text-lg px-8">
                  <Link href="/register?role=ORGANISATEUR">
                    <Home className="h-5 w-5" />
                    Je suis organisateur
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 text-lg px-8"
                >
                  <Link href="/register?role=GROUPE">
                    <Guitar className="h-5 w-5" />
                    Je suis un groupe
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Comment ca marche */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Comment &ccedil;a marche ?
            </h2>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <Card className="text-center border-none shadow-md">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Guitar className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Les groupes s&apos;inscrivent
                  </h3>
                  <p className="text-muted-foreground">
                    Les artistes cr&eacute;ent leur profil avec bio, photos et vid&eacute;os
                    YouTube pour se pr&eacute;senter.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-none shadow-md">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Home className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    L&apos;organisateur choisit
                  </h3>
                  <p className="text-muted-foreground">
                    Parcourez les groupes de votre r&eacute;gion, &eacute;coutez leur musique
                    et contactez-les directement.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-none shadow-md">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Music className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Le concert a lieu
                  </h3>
                  <p className="text-muted-foreground">
                    Cr&eacute;ez une page d&apos;&eacute;v&eacute;nement, invitez vos amis et profitez d&apos;un
                    concert unique dans votre salon.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pour les organisateurs */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Pour les organisateurs
                </h2>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      D&eacute;couvrez les groupes de votre r&eacute;gion et &eacute;coutez leur musique
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Cr&eacute;ez une page web unique pour chaque concert
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      G&eacute;rez les inscriptions avec jauge et liste d&apos;attente
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Constituez votre carnet de contacts et r&eacute;invitez facilement
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Utilisez des templates pour inviter par email, SMS ou WhatsApp
                    </span>
                  </li>
                </ul>
                <Button asChild className="mt-8 gap-2">
                  <Link href="/register?role=ORGANISATEUR">
                    Commencer <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-2xl">Simple</p>
                  <p className="text-sm text-muted-foreground">
                    Cr&eacute;ez un concert en quelques clics
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-2xl">Social</p>
                  <p className="text-sm text-muted-foreground">
                    G&eacute;rez votre communaut&eacute;
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-2xl">Pratique</p>
                  <p className="text-sm text-muted-foreground">
                    Invitez en un clic
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Music className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-2xl">Intime</p>
                  <p className="text-sm text-muted-foreground">
                    Des concerts uniques
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Pour les groupes */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 items-center max-w-5xl mx-auto">
              <div className="order-2 md:order-1">
                <Card className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Guitar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Votre profil</p>
                        <p className="text-sm text-muted-foreground">
                          Visible par les organisateurs
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Bio et pr&eacute;sentation</p>
                      <p>Photos du groupe</p>
                      <p>Vid&eacute;os YouTube int&eacute;gr&eacute;es</p>
                      <p>Genres musicaux</p>
                      <p>Zone g&eacute;ographique</p>
                      <p>Coordonn&eacute;es de contact</p>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold mb-6">Pour les groupes</h2>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Cr&eacute;ez votre vitrine avec bio, photos et vid&eacute;os
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Soyez d&eacute;couvert par des organisateurs de votre r&eacute;gion
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Jouez dans des lieux intimes et chaleureux
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span>
                      Rencontrez un public passionn&eacute; et proche
                    </span>
                  </li>
                </ul>
                <Button asChild className="mt-8 gap-2">
                  <Link href="/register?role=GROUPE">
                    Inscrire mon groupe <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pr&ecirc;t &agrave; vivre la musique autrement ?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Rejoignez Concert Chaussettes et participez &agrave; l&apos;aventure
              des concerts priv&eacute;s chez l&apos;habitant.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="gap-2 px-8">
                <Link href="/register">
                  S&apos;inscrire gratuitement
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/login">D&eacute;j&agrave; un compte ? Se connecter</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
