import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { concerts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Music, Clock, Ticket, Play, ExternalLink } from "lucide-react";
import { InscriptionForm } from "@/components/forms/inscription-form";
import Image from "next/image";
import Link from "next/link";
import { ConcertPhotoGallery } from "./photo-gallery";
import { GuestList } from "./guest-list";
import { EmailLookup } from "./email-lookup";

interface ConcertPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConcertPublicPage({ params }: ConcertPageProps) {
  const { slug } = await params;

  const concert = await db.query.concerts.findFirst({
    where: and(eq(concerts.slug, slug), eq(concerts.status, "PUBLIE")),
    with: {
      groupe: {
        with: {
          groupeGenres: {
            with: {
              genre: true,
            },
          },
        },
      },
      organisateur: true,
      inscriptions: true,
    },
  });

  if (!concert) {
    notFound();
  }

  const confirmedCount = concert.inscriptions
    .filter((i) => i.status === "CONFIRME")
    .reduce((sum, i) => sum + i.nombrePersonnes, 0);

  const isFull = concert.maxInvites ? confirmedCount >= concert.maxInvites : false;
  const remainingSpots = concert.maxInvites
    ? concert.maxInvites - confirmedCount
    : null;

  const isPast = new Date(concert.date) < new Date();

  // Get guests who opted in to show in guest list
  const visibleGuests = concert.inscriptions
    .filter((i) => i.status === "CONFIRME" && i.showInGuestList !== false)
    .map((i) => ({
      prenom: i.prenom,
      nombrePersonnes: i.nombrePersonnes,
    }));

  // Get group photos
  const groupePhotos = concert.groupe?.photos as string[] | undefined;
  const groupeThumbnail = concert.groupe?.thumbnailUrl;
  const heroImage = groupeThumbnail || (groupePhotos && groupePhotos[0]) || null;
  const youtubeVideos = (concert.groupe?.youtubeVideos as string[] | undefined) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header with logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="Concert Chaussettes"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-lg hidden sm:inline">Concert Chaussettes</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-end pb-8 pt-20">
        {/* Background */}
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt={concert.titre}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-gray-900/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
          </div>
        )}

        {/* Content */}
        <div className="relative container mx-auto px-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {isPast ? (
              <Badge className="bg-gray-600 text-white border-0">Concert termine</Badge>
            ) : isFull ? (
              <Badge className="bg-red-500 text-white border-0 animate-pulse">Complet</Badge>
            ) : remainingSpots && remainingSpots <= 20 ? (
              <Badge className="bg-orange-500 text-white border-0 animate-pulse">
                <Ticket className="h-3 w-3 mr-1" />
                Plus que {remainingSpots} place{remainingSpots > 1 ? "s" : ""} !
              </Badge>
            ) : (
              <Badge className="bg-green-500 text-white border-0">Places disponibles</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {concert.titre}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <CalendarDays className="h-5 w-5 text-orange-400" />
              <span className="font-medium">
                {format(new Date(concert.date), "EEEE d MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-5 w-5 text-orange-400" />
              <span className="font-medium">
                {format(new Date(concert.date), "HH:mm", { locale: fr })}
              </span>
            </div>
            {concert.adressePublique && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <MapPin className="h-5 w-5 text-orange-400" />
                <span className="font-medium">{concert.adressePublique}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left column - Concert details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {concert.description && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" />
                  A propos de l&apos;evenement
                </h2>
                <p className="text-white/80 whitespace-pre-wrap leading-relaxed text-lg">
                  {concert.description}
                </p>
              </section>
            )}

            {/* Group section */}
            {concert.showGroupe && concert.groupe && (
              <section className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" />
                  L&apos;artiste
                </h2>

                {/* Group header */}
                <div className="flex items-center gap-4">
                  {groupeThumbnail ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-orange-500/50">
                      <Image
                        src={groupeThumbnail}
                        alt={concert.groupe.nom}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                      <Music className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">{concert.groupe.nom}</h3>
                    {concert.groupe.ville && (
                      <p className="text-white/60 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {concert.groupe.ville}
                      </p>
                    )}
                  </div>
                </div>

                {/* Genres */}
                {concert.groupe.groupeGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {concert.groupe.groupeGenres.map((gg) => (
                      <Badge
                        key={gg.genre.id}
                        className="bg-white/10 hover:bg-white/20 text-white border-0 px-3 py-1"
                      >
                        {gg.genre.nom}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {concert.groupe.bio && (
                  <p className="text-white/70 leading-relaxed">
                    {concert.groupe.bio}
                  </p>
                )}

                {/* Photo gallery */}
                {groupePhotos && groupePhotos.length > 0 && (
                  <ConcertPhotoGallery photos={groupePhotos} groupeName={concert.groupe.nom} />
                )}

                {/* YouTube videos */}
                {youtubeVideos.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-white/90 flex items-center gap-2">
                      <Play className="h-4 w-4 text-red-500" />
                      Videos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {youtubeVideos.slice(0, 2).map((videoId) => (
                        <div
                          key={videoId}
                          className="aspect-video rounded-xl overflow-hidden bg-black/50"
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link to group profile */}
                <Link
                  href={`/groupes/${concert.groupe.id}`}
                  className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Voir le profil complet
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </section>
            )}
          </div>

          {/* Right column - Registration */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-6 text-center">
                  {isPast
                    ? "Concert termine"
                    : isFull
                      ? "Liste d'attente"
                      : "Reservez votre place"}
                </h2>

                {isPast ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                      <CalendarDays className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-white/60">
                      Ce concert a deja eu lieu.
                    </p>
                  </div>
                ) : (
                  <>
                    <InscriptionForm
                      concertId={concert.id}
                      isFull={isFull}
                      maxInvites={concert.maxInvites}
                      confirmedCount={confirmedCount}
                    />
                    <EmailLookup concertId={concert.id} />
                  </>
                )}
              </div>

              {/* Guest list */}
              {confirmedCount > 0 && (
                <div className="mt-6">
                  <GuestList guests={visibleGuests} totalCount={confirmedCount} />
                </div>
              )}

              {/* Trust indicators */}
              <div className="mt-6 text-center text-sm text-white/40">
                <p>Evenement organise par</p>
                <p className="font-medium text-white/60 mt-1">{concert.organisateur.nom}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Concert Chaussettes"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-white/60 text-sm">Concert Chaussettes</span>
            </div>
            <p className="text-white/40 text-sm">
              Concerts prives et intimes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
