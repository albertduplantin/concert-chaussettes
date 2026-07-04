import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { organisateurs, avis, concerts } from "@/lib/db/schema";
import { eq, and, avg, count, inArray } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  ArrowLeft,
  Star,
  Music2,
  Users,
  Plug,
  Home,
} from "lucide-react";
import { GroupeGallery } from "@/components/groupes/groupe-gallery";
import { ContactOrganisateurCTA } from "@/components/organisateurs/contact-organisateur-cta";
import { TrackView } from "@/components/analytics/track-view";
import { ReportButton } from "@/components/moderation/report-button";
import { SouvenirsSection } from "@/components/avis/souvenirs-section";
import { getConcertSouvenirs } from "@/lib/souvenirs";
import { filterRevealedAvis } from "@/lib/avis-reveal";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.id, id),
    columns: { nom: true, bio: true, thumbnailUrl: true },
  });

  if (!organisateur) {
    return { title: "Organisateur non trouvé" };
  }

  return {
    title: `${organisateur.nom} | Concert Chaussettes`,
    description: organisateur.bio?.slice(0, 160) || `Découvrez ${organisateur.nom} sur Concert Chaussettes`,
    openGraph: {
      title: organisateur.nom,
      description: organisateur.bio?.slice(0, 160),
      images: organisateur.thumbnailUrl ? [organisateur.thumbnailUrl] : [],
    },
  };
}

export default async function OrganisateurPage({ params }: PageProps) {
  const { id } = await params;

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.id, id),
  });

  if (!organisateur) {
    notFound();
  }

  const concertsPasses = await db.query.concerts.findMany({
    where: and(eq(concerts.organisateurId, organisateur.id), eq(concerts.status, "PASSE")),
    columns: { id: true },
  });
  const concertIds = concertsPasses.map((c) => c.id);

  const [avisStatsResult, avisListeRaw, souvenirs] = await Promise.all([
    db
      .select({ avgNote: avg(avis.note), total: count(avis.id) })
      .from(avis)
      .where(and(eq(avis.organisateurId, organisateur.id), eq(avis.cible, "ORGANISATEUR"), eq(avis.isVisible, true))),
    concertIds.length > 0
      ? db.query.avis.findMany({
          where: and(inArray(avis.concertId, concertIds), eq(avis.isVisible, true)),
          columns: {
            id: true, auteurNom: true, auteurType: true, cible: true, note: true,
            commentaire: true, createdAt: true, concertId: true, revealAt: true, organisateurId: true,
          },
          orderBy: (a, { desc }) => [desc(a.createdAt)],
          limit: 30,
        })
      : Promise.resolve([]),
    getConcertSouvenirs(concertIds),
  ]);

  const avisStats = avisStatsResult[0];
  const avgNote = avisStats.avgNote ? parseFloat(Number(avisStats.avgNote).toFixed(1)) : null;
  const avisCount = Number(avisStats.total);
  const concertsCount = concertIds.length;

  // Seuls les avis qui NOTENT l'organisateur (cible = ORGANISATEUR) sont affichés ici,
  // filtrés par la règle de révélation différée façon Airbnb.
  const avisListe = filterRevealedAvis(
    avisListeRaw.filter((a) => a.cible === "ORGANISATEUR" && a.organisateurId === organisateur.id)
  );

  const allPhotos = [
    ...(organisateur.thumbnailUrl ? [organisateur.thumbnailUrl] : []),
    ...(organisateur.photos || []),
  ].filter((p, i, arr) => arr.indexOf(p) === i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <Header />
      <TrackView type="PROFILE_VIEW" targetId={organisateur.id} />

      <div className="container max-w-6xl mx-auto px-4 py-4">
        <Button variant="ghost" asChild className="gap-2 -ml-2">
          <Link href="/organisateurs">
            <ArrowLeft className="h-4 w-4" />
            Retour aux résultats
          </Link>
        </Button>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Media */}
          <div className="space-y-4">
            {allPhotos.length > 0 ? (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={allPhotos[0]}
                  alt={organisateur.nom}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
                <Home className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
            {allPhotos.length > 1 && (
              <GroupeGallery photos={allPhotos} groupeName={organisateur.nom} />
            )}
          </div>

          {/* Right column - Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{organisateur.nom}</h1>
              {(organisateur.ville || organisateur.departement || organisateur.region) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span>
                    {[organisateur.ville, organisateur.departement, organisateur.region]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 py-4 border-y">
              <div className="flex items-center gap-2">
                <Star className={`h-5 w-5 ${avgNote ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
                {avgNote ? (
                  <>
                    <span className="font-semibold text-lg">{avgNote}</span>
                    <span className="text-muted-foreground">({avisCount} avis)</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Pas encore d&apos;avis</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-lg">{concertsCount}</span>
                <span className="text-muted-foreground">concerts</span>
              </div>
              {organisateur.capaciteMax && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-lg">{organisateur.capaciteMax}</span>
                  <span className="text-muted-foreground">places max.</span>
                </div>
              )}
            </div>

            {/* Équipements */}
            {organisateur.equipements && organisateur.equipements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {organisateur.equipements.map((eq) => (
                  <Badge key={eq} variant="secondary" className="text-sm px-3 py-1 gap-1">
                    <Plug className="h-3 w-3" />
                    {eq}
                  </Badge>
                ))}
              </div>
            )}

            {/* Bio */}
            {organisateur.bio && (
              <div>
                <h2 className="font-semibold text-lg mb-2">Présentation</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {organisateur.bio}
                </p>
              </div>
            )}

            {/* Contact CTA */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <ContactOrganisateurCTA organisateurId={organisateur.id} organisateurNom={organisateur.nom} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Souvenirs */}
      <SouvenirsSection souvenirs={souvenirs} />

      {/* Reviews */}
      <div className="container max-w-6xl mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Avis des groupes</h2>
          {avgNote && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{avgNote}</span>
              <span className="text-muted-foreground">({avisCount} avis)</span>
            </div>
          )}
        </div>

        {avisListe.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun avis publié pour le moment. Les avis des groupes apparaissent une fois que les deux parties ont répondu.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avisListe.map((a) => (
              <Card key={a.id} className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{a.auteurNom || "Anonyme"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < a.note ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  {a.commentaire && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.commentaire}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-end">
        <ReportButton targetType="organisateur" targetId={organisateur.id} targetName={organisateur.nom} />
      </div>
    </div>
  );
}
