import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import {
  CalendarDays,
  Users,
  Music2,
  TrendingUp,
  Plus,
  Search,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  Rocket,
  PartyPopper,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function OrganisateurDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  // Get organisateur profile with relations
  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    with: {
      concerts: {
        with: {
          inscriptions: true,
          groupe: true,
        },
        orderBy: (concerts, { desc }) => [desc(concerts.date)],
      },
      contacts: true,
      messageTemplates: true,
    },
  });

  if (!organisateur) {
    redirect("/onboarding/role");
  }

  // Get subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const isPremium = subscription?.plan === "PREMIUM";

  // Calculate stats
  const now = new Date();
  const allConcerts = organisateur.concerts || [];
  const upcomingConcerts = allConcerts.filter(c => new Date(c.date) > now && c.status !== "ANNULE");
  const pastConcerts = allConcerts.filter(c => new Date(c.date) <= now);
  const publishedConcerts = allConcerts.filter(c => c.status === "PUBLIE");

  // Total guests from all concerts
  const totalGuests = allConcerts.reduce((acc, concert) => {
    const confirmedGuests = concert.inscriptions
      ?.filter(i => i.status === "CONFIRME")
      .reduce((sum, i) => sum + i.nombrePersonnes, 0) || 0;
    return acc + confirmedGuests;
  }, 0);

  // Profile completion
  const profileChecks = [
    { id: "name", completed: !!organisateur.nom, title: "Ajouter votre nom", href: "/dashboard/organisateur/profil" },
    { id: "location", completed: !!organisateur.ville, title: "Indiquer votre localisation", description: "Pour mieux cibler les groupes proches", href: "/dashboard/organisateur/profil", action: "Ajouter" },
    { id: "concert", completed: allConcerts.length > 0, title: "Créer votre premier concert", description: "Lancez-vous !", href: "/dashboard/organisateur/concerts/new", action: "Créer" },
    { id: "contacts", completed: (organisateur.contacts?.length || 0) > 0, title: "Importer vos contacts", description: "Invitez vos proches facilement", href: "/dashboard/organisateur/contacts", action: "Importer" },
    { id: "templates", completed: (organisateur.messageTemplates?.length || 0) > 0, title: "Créer un template de message", description: "Gagnez du temps sur vos invitations", href: "/dashboard/organisateur/messages", action: "Créer" },
  ];

  const completedCount = profileChecks.filter((c) => c.completed).length;
  const profileCompletion = Math.round((completedCount / profileChecks.length) * 100);
  const isProfileComplete = profileCompletion >= 80;

  // Next 3 upcoming concerts for preview
  const nextConcerts = upcomingConcerts.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <PartyPopper className="h-6 w-6" />
            </div>
            {isPremium && (
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Bonjour {organisateur.nom} !
          </h1>
          <p className="text-white/90 max-w-xl mb-4">
            {isProfileComplete
              ? upcomingConcerts.length > 0
                ? `Vous avez ${upcomingConcerts.length} concert${upcomingConcerts.length > 1 ? "s" : ""} à venir. Prêt à faire la fête ?`
                : "Votre espace est prêt. Créez votre prochain concert !"
              : "Complétez votre profil pour profiter de toutes les fonctionnalités."}
          </p>
          {!isProfileComplete ? (
            <div className="flex gap-3">
              <Button asChild className="bg-white text-orange-600 hover:bg-white/90 gap-2">
                <Link href="/dashboard/organisateur/concerts/new">
                  <Rocket className="h-4 w-4" />
                  Créer mon premier concert
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button asChild className="bg-white text-orange-600 hover:bg-white/90 gap-2">
                <Link href="/dashboard/organisateur/concerts/new">
                  <Plus className="h-4 w-4" />
                  Nouveau concert
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/dashboard/organisateur/search">
                  <Search className="h-4 w-4 mr-2" />
                  Trouver un groupe
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding checklist */}
      {!isProfileComplete && (
        <OnboardingChecklist
          title="Démarrez votre activité"
          items={profileChecks}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Concerts organisés"
          value={allConcerts.length}
          icon={CalendarDays}
          subtitle={`${publishedConcerts.length} publiés`}
        />
        <StatsCard
          title="Concerts à venir"
          value={upcomingConcerts.length}
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatsCard
          title="Invités total"
          value={totalGuests}
          icon={Users}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
          subtitle="confirmés"
        />
        <StatsCard
          title="Contacts"
          value={organisateur.contacts?.length || 0}
          icon={Mail}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          subtitle="dans votre CRM"
        />
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming concerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Prochains concerts</CardTitle>
              <CardDescription>Vos événements à venir</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/organisateur/concerts">
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {nextConcerts.length > 0 ? (
              <div className="space-y-4">
                {nextConcerts.map((concert) => {
                  const confirmedGuests = concert.inscriptions
                    ?.filter(i => i.status === "CONFIRME")
                    .reduce((sum, i) => sum + i.nombrePersonnes, 0) || 0;

                  return (
                    <Link
                      key={concert.id}
                      href={`/dashboard/organisateur/concerts/${concert.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                        <span className="text-lg font-bold text-orange-600">
                          {format(new Date(concert.date), "dd", { locale: fr })}
                        </span>
                        <span className="text-xs text-orange-600/70 uppercase">
                          {format(new Date(concert.date), "MMM", { locale: fr })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-orange-600 transition-colors">
                          {concert.titre}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {concert.ville && (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>{concert.ville}</span>
                            </>
                          )}
                          {concert.groupe && (
                            <>
                              <span>•</span>
                              <Music2 className="h-3 w-3" />
                              <span>{concert.groupe.nom}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={concert.status === "PUBLIE" ? "default" : "secondary"}>
                          {concert.status === "PUBLIE" ? "Publié" : "Brouillon"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {confirmedGuests} invité{confirmedGuests > 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Aucun concert à venir</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/organisateur/concerts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un concert
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
            <CardDescription>Gérez votre activité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
              <Link href="/dashboard/organisateur/concerts/new">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Plus className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Nouveau concert</p>
                  <p className="text-xs text-muted-foreground">Créer un événement privé</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
              <Link href="/dashboard/organisateur/search">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Trouver un groupe</p>
                  <p className="text-xs text-muted-foreground">Parcourir les artistes</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
              <Link href="/dashboard/organisateur/contacts">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Gérer mes contacts</p>
                  <p className="text-xs text-muted-foreground">{organisateur.contacts?.length || 0} contacts</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
              <Link href="/dashboard/organisateur/messages">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Templates messages</p>
                  <p className="text-xs text-muted-foreground">{organisateur.messageTemplates?.length || 0} templates</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity / Past concerts summary */}
      {pastConcerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Résumé de votre activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-orange-600">{pastConcerts.length}</p>
                <p className="text-sm text-muted-foreground">concerts passés</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">{totalGuests}</p>
                <p className="text-sm text-muted-foreground">invités au total</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-600">
                  {pastConcerts.filter(c => c.groupe).length}
                </p>
                <p className="text-sm text-muted-foreground">avec des groupes</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(totalGuests / Math.max(pastConcerts.length, 1))}
                </p>
                <p className="text-sm text-muted-foreground">invités/concert</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
