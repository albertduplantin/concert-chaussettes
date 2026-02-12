import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { groupes, avis, concerts } from "@/lib/db/schema";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { GroupeAvisForm } from "@/components/avis/groupe-avis-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  Zap,
  CalendarPlus,
  ArrowLeft,
  Star,
  Music2,
  Youtube,
  Play,
} from "lucide-react";
import { GroupeGallery } from "@/components/groupes/groupe-gallery";
import { GroupeVideoPlayer } from "@/components/groupes/groupe-video-player";
import { GroupeActionButtons } from "@/components/groupes/groupe-action-buttons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.id, id),
  });

  if (!groupe) {
    return { title: "Groupe non trouvé" };
  }

  return {
    title: `${groupe.nom} | Concert Chaussettes`,
    description: groupe.bio?.slice(0, 160) || `Découvrez ${groupe.nom} sur Concert Chaussettes`,
    openGraph: {
      title: groupe.nom,
      description: groupe.bio?.slice(0, 160),
      images: groupe.thumbnailUrl ? [groupe.thumbnailUrl] : [],
    },
  };
}

export default async function GroupePage({ params }: PageProps) {
  const { id } = await params;

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.id, id),
    with: {
      groupeGenres: {
        with: {
          genre: true,
        },
      },
    },
  });

  if (!groupe) {
    notFound();
  }

  // Real stats from DB
  const [avisStats] = await db
    .select({ avgNote: avg(avis.note), total: count(avis.id) })
    .from(avis)
    .where(and(eq(avis.groupeId, groupe.id), eq(avis.isVisible, true)));

  const avisListe = await db.query.avis.findMany({
    where: and(eq(avis.groupeId, groupe.id), eq(avis.isVisible, true)),
    columns: { id: true, auteurNom: true, auteurType: true, note: true, commentaire: true, createdAt: true },
    orderBy: [desc(avis.createdAt)],
    limit: 10,
  });

  const [concertsStats] = await db
    .select({ total: count(concerts.id) })
    .from(concerts)
    .where(and(eq(concerts.groupeId, groupe.id), eq(concerts.status, "PASSE")));

  const avgNote = avisStats.avgNote ? parseFloat(Number(avisStats.avgNote).toFixed(1)) : null;
  const avisCount = Number(avisStats.total);
  const concertsCount = Number(concertsStats.total);

  const allPhotos = [
    ...(groupe.thumbnailUrl ? [groupe.thumbnailUrl] : []),
    ...(groupe.photos || []),
  ].filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <Header />

      {/* Back navigation */}
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <Button variant="ghost" asChild className="gap-2 -ml-2">
          <Link href="/dashboard/organisateur">
            <ArrowLeft className="h-4 w-4" />
            Retour aux résultats
          </Link>
        </Button>
      </div>

      {/* Hero section with main photo */}
      <div className="container max-w-6xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Media */}
          <div className="space-y-4">
            {/* Main media - Video or Photo */}
            {groupe.youtubeVideos && groupe.youtubeVideos.length > 0 ? (
              <GroupeVideoPlayer
                videos={groupe.youtubeVideos}
                groupeName={groupe.nom}
              />
            ) : allPhotos.length > 0 ? (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={allPhotos[0]}
                  alt={groupe.nom}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
                <Music2 className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}

            {/* Photo gallery */}
            {allPhotos.length > 1 && (
              <GroupeGallery photos={allPhotos} groupeName={groupe.nom} />
            )}
          </div>

          {/* Right column - Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {groupe.nom}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {groupe.isVerified && (
                      <Badge className="gap-1 bg-blue-500 text-white border-0">
                        <CheckCircle className="h-3 w-3" />
                        Vérifié
                      </Badge>
                    )}
                    {groupe.isBoosted && (
                      <Badge className="gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                        <Zap className="h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                <GroupeActionButtons groupeId={groupe.id} groupeNom={groupe.nom} />
              </div>

              {/* Location */}
              {(groupe.ville || groupe.departement || groupe.region) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span>
                    {[groupe.ville, groupe.departement, groupe.region]
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
              {groupe.youtubeVideos && groupe.youtubeVideos.length > 0 && (
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-lg">
                    {groupe.youtubeVideos.length}
                  </span>
                  <span className="text-muted-foreground">
                    vidéo{groupe.youtubeVideos.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Genres */}
            {groupe.groupeGenres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groupe.groupeGenres.map((gg) => (
                  <Badge
                    key={gg.genre.id}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {gg.genre.nom}
                  </Badge>
                ))}
              </div>
            )}

            {/* Bio */}
            {groupe.bio && (
              <div>
                <h2 className="font-semibold text-lg mb-2">Présentation</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {groupe.bio}
                </p>
              </div>
            )}

            {/* Contact card */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Contacter {groupe.nom}</h2>

                <div className="space-y-3">
                  {groupe.contactEmail && (
                    <a
                      href={`mailto:${groupe.contactEmail}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <Mail className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-sm truncate">{groupe.contactEmail}</span>
                    </a>
                  )}
                  {groupe.contactTel && (
                    <a
                      href={`tel:${groupe.contactTel}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <Phone className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-sm">{groupe.contactTel}</span>
                    </a>
                  )}
                  {groupe.contactSite && (
                    <a
                      href={groupe.contactSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <Globe className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-sm truncate">{groupe.contactSite}</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    asChild
                    className="flex-1 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <Link
                      href={`/dashboard/organisateur/concerts/new?groupeId=${groupe.id}`}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Organiser un concert avec ce groupe
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Additional videos section */}
      {groupe.youtubeVideos && groupe.youtubeVideos.length > 1 && (
        <div className="container max-w-6xl mx-auto px-4 py-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Plus de vidéos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupe.youtubeVideos.slice(1).map((videoId, index) => (
              <div
                key={videoId}
                className="aspect-video rounded-xl overflow-hidden shadow-lg"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`${groupe.nom} - Vidéo ${index + 2}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div className="container max-w-6xl mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Avis</h2>
          {avgNote && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{avgNote}</span>
              <span className="text-muted-foreground">({avisCount} avis)</span>
            </div>
          )}
        </div>
        <GroupeAvisForm groupeId={groupe.id} groupeNom={groupe.nom} />

        {avisListe.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Soyez le premier à laisser un avis sur ce groupe !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avisListe.map((a) => (
              <Card key={a.id} className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{a.auteurNom || "Anonyme"}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.auteurType === "ORGANISATEUR" ? "Organisateur" : "Invité"}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
