import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, subscriptions, concerts, avis, analytics } from "@/lib/db/schema";
import { eq, and, desc, avg, count, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  OnboardingChecklist,
  StatsCard,
  EmptyState,
} from "@/components/dashboard";
import {
  Guitar,
  Sparkles,
  CalendarDays,
  Star,
  TrendingUp,
  Eye,
  User,
  Image as ImageIcon,
  Youtube,
  MapPin,
  FileText,
  ChevronRight,
  Music,
  Rocket,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function GroupeDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    redirect("/");
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: {
      id: true, nom: true, bio: true, ville: true, departement: true,
      isVerified: true, isBoosted: true, boostExpiresAt: true, isVisible: true,
      thumbnailUrl: true, photos: true, youtubeVideos: true, contactEmail: true,
    },
    with: {
      groupeGenres: {
        columns: { genreId: true },
        with: {
          genre: { columns: { id: true, nom: true } },
        },
      },
      concerts: {
        columns: { id: true, titre: true, date: true, ville: true, status: true },
        orderBy: [desc(concerts.date)],
        limit: 5,
        with: {
          organisateur: { columns: { nom: true } },
        },
      },
    },
  });

  if (!groupe) {
    redirect("/");
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const isPremium = subscription?.plan === "PREMIUM";

  // Calculate profile completion
  const wizardHref = "/dashboard/groupe/onboarding";
  const profileChecks = [
    { id: "name", completed: !!groupe.nom, title: "Ajouter le nom du groupe", href: wizardHref },
    { id: "photo", completed: !!groupe.thumbnailUrl, title: "Ajouter une photo de profil", description: "Les groupes avec photos reçoivent 47% de clics en plus", href: wizardHref, action: "Ajouter" },
    { id: "bio", completed: !!groupe.bio && groupe.bio.length > 50, title: "Rédiger votre bio", description: "Présentez-vous en quelques lignes", href: wizardHref, action: "Rédiger" },
    { id: "photos", completed: (groupe.photos?.length || 0) >= 3, title: "Ajouter des photos (3 minimum)", description: "Montrez votre univers visuel", href: wizardHref, action: "Ajouter" },
    { id: "videos", completed: (groupe.youtubeVideos?.length || 0) >= 1, title: "Ajouter une vidéo YouTube", description: "La vidéo est le meilleur moyen de convaincre", href: wizardHref, action: "Ajouter" },
    { id: "location", completed: !!groupe.ville, title: "Indiquer votre localisation", description: "Pour être trouvé par les organisateurs proches", href: wizardHref, action: "Ajouter" },
    { id: "genres", completed: groupe.groupeGenres.length > 0, title: "Sélectionner vos genres musicaux", href: wizardHref, action: "Choisir" },
    { id: "contact", completed: !!groupe.contactEmail, title: "Ajouter vos coordonnées", href: wizardHref, action: "Ajouter" },
  ];

  const completedCount = profileChecks.filter((c) => c.completed).length;
  const profileCompletion = Math.round((completedCount / profileChecks.length) * 100);
  const isProfileComplete = profileCompletion >= 80;

  // Real stats from DB
  const [avisStats] = await db
    .select({ avgNote: avg(avis.note), total: count(avis.id) })
    .from(avis)
    .where(and(eq(avis.groupeId, groupe.id), eq(avis.isVisible, true)));

  const totalConcerts = await db
    .select({ total: count(concerts.id) })
    .from(concerts)
    .where(eq(concerts.groupeId, groupe.id));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const profileViews = await db
    .select({ total: count(analytics.id) })
    .from(analytics)
    .where(and(
      eq(analytics.type, "PROFILE_VIEW"),
      eq(analytics.targetId, groupe.id),
      gte(analytics.createdAt, thirtyDaysAgo)
    ));

  const stats = {
    concerts: totalConcerts[0]?.total || 0,
    rating: avisStats?.avgNote ? parseFloat(Number(avisStats.avgNote).toFixed(1)) : null,
    reviews: Number(avisStats?.total) || 0,
    views: profileViews[0]?.total || 0,
  };

  // Upcoming concerts
  const upcomingConcerts = groupe.concerts?.filter(
    (c) => new Date(c.date) > new Date() && c.status === "PUBLIE"
  ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Guitar className="h-6 w-6" />
            </div>
            {isPremium && (
              <Badge className="bg-white/20 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Bonjour {groupe.nom} !
          </h1>
          <p className="text-white/90 max-w-xl mb-4">
            {isProfileComplete
              ? "Votre profil est optimisé. Continuez à le faire vivre avec de nouvelles photos et vidéos !"
              : "Complétez votre profil pour apparaître dans les recherches et recevoir des demandes."}
          </p>
          {!isProfileComplete && (
            <div className="flex gap-3">
              <Button asChild className="bg-white text-orange-600 hover:bg-white/90 gap-2">
                <Link href="/dashboard/groupe/onboarding">
                  <Rocket className="h-4 w-4" />
                  Compléter mon profil guidé
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/dashboard/groupe/profil">
                  Tout remplir d'un coup
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile completion checklist (if not complete) */}
      {!isProfileComplete && (
        <OnboardingChecklist
          title="Complétez votre profil"
          items={profileChecks}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Vues du profil (30j)"
          value={stats.views}
          icon={Eye}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          subtitle="Visiteurs uniques"
        />
        <StatsCard
          title="Concerts"
          value={stats.concerts}
          icon={CalendarDays}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatsCard
          title="Note moyenne"
          value={stats.rating ? `${stats.rating}/5` : "—"}
          icon={Star}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100 dark:bg-yellow-900/30"
          subtitle={stats.reviews > 0 ? `${stats.reviews} avis` : "Pas encore d'avis"}
        />
        <StatsCard
          title="Profil"
          value={`${profileCompletion}%`}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
          subtitle={isProfileComplete ? "Complet" : "À améliorer"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile summary */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Aperçu du profil</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/groupe/profil">
                Modifier
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {groupe.thumbnailUrl ? (
                <img
                  src={groupe.thumbnailUrl}
                  alt={groupe.nom}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{groupe.nom}</h3>
                {groupe.ville && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {groupe.ville}, {groupe.departement}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">{groupe.photos?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Youtube className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">{groupe.youtubeVideos?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Vidéos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Music className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">{groupe.groupeGenres.length}</p>
                <p className="text-xs text-muted-foreground">Genres</p>
              </div>
            </div>

            {groupe.groupeGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {groupe.groupeGenres.slice(0, 5).map((gg) => (
                  <Badge key={gg.genre.id} variant="secondary" className="text-xs">
                    {gg.genre.nom}
                  </Badge>
                ))}
                {groupe.groupeGenres.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{groupe.groupeGenres.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming concerts */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Prochains concerts</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/groupe/concerts">
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingConcerts.length > 0 ? (
              <div className="space-y-3">
                {upcomingConcerts.slice(0, 3).map((concert) => (
                  <div
                    key={concert.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                      <span className="text-lg font-bold text-orange-600">
                        {format(new Date(concert.date), "d")}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {format(new Date(concert.date), "MMM", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{concert.titre}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {concert.ville || "Lieu à confirmer"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Aucun concert à venir
                </p>
                <p className="text-xs text-muted-foreground">
                  Les organisateurs vous contacteront bientôt !
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Sparkles className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Conseil du jour</h3>
              <p className="text-sm text-muted-foreground">
                {!groupe.youtubeVideos?.length
                  ? "Ajoutez une vidéo YouTube de vous en live ! C'est le meilleur moyen de convaincre les organisateurs."
                  : !groupe.bio || groupe.bio.length < 100
                  ? "Une bio détaillée aide les organisateurs à vous connaître. Parlez de votre parcours, votre style, vos influences."
                  : (groupe.photos?.length || 0) < 5
                  ? "Ajoutez plus de photos ! Les profils avec 5+ photos reçoivent 2x plus de demandes."
                  : "Votre profil est bien rempli ! Pensez à le mettre à jour régulièrement avec de nouvelles photos et vidéos."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0"
            >
              <Link href="/dashboard/groupe/profil">
                Modifier le profil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
