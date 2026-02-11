import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/header";
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
  Share2,
  Heart,
  Play,
} from "lucide-react";
import { GroupeGallery } from "@/components/groupes/groupe-gallery";
import { GroupeVideoPlayer } from "@/components/groupes/groupe-video-player";

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

  // Mock stats (would come from analytics in production)
  const stats = {
    rating: 4.8,
    reviewsCount: 12,
    concertsCount: 24,
  };

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
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
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
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{stats.rating}</span>
                <span className="text-muted-foreground">
                  ({stats.reviewsCount} avis)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-lg">{stats.concertsCount}</span>
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

      {/* Reviews section placeholder */}
      <div className="container max-w-6xl mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Avis</h2>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{stats.rating}</span>
            <span className="text-muted-foreground">
              ({stats.reviewsCount} avis)
            </span>
          </div>
        </div>
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Les avis seront bientôt disponibles.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
