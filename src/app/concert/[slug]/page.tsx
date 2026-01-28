import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { concerts, inscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Music, Users } from "lucide-react";
import { InscriptionForm } from "@/components/forms/inscription-form";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          {/* En-tête du concert */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">{concert.titre}</h1>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {format(new Date(concert.date), "EEEE d MMMM yyyy 'à' HH:mm", {
                  locale: fr,
                })}
              </span>
              {concert.adressePublique && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {concert.adressePublique}
                </span>
              )}
            </div>
            {concert.maxInvites && (
              <div className="mt-4">
                {isFull ? (
                  <Badge variant="destructive" className="text-sm">
                    Complet
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm">
                    <Users className="h-3 w-3 mr-1" />
                    {remainingSpots} place{remainingSpots! > 1 ? "s" : ""} restante
                    {remainingSpots! > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {concert.description && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">{concert.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Groupe (si affiché) */}
          {concert.showGroupe && concert.groupe && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  {concert.groupe.nom}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {concert.groupe.groupeGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {concert.groupe.groupeGenres.map((gg) => (
                      <Badge key={gg.genre.id} variant="outline">
                        {gg.genre.nom}
                      </Badge>
                    ))}
                  </div>
                )}

                {concert.groupe.bio && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {concert.groupe.bio}
                  </p>
                )}

                {/* Vidéos YouTube */}
                {concert.groupe.youtubeVideos &&
                  (concert.groupe.youtubeVideos as string[]).length > 0 && (
                    <div className="space-y-3">
                      {(concert.groupe.youtubeVideos as string[]).map(
                        (videoId) => (
                          <div
                            key={videoId}
                            className="aspect-video rounded-lg overflow-hidden"
                          >
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title="YouTube video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          {/* Formulaire d'inscription */}
          {isPast ? (
            <Card className="text-center p-8">
              <p className="text-muted-foreground">
                Ce concert est d&eacute;j&agrave; pass&eacute;.
              </p>
            </Card>
          ) : (
            <InscriptionForm
              concertId={concert.id}
              isFull={isFull}
              maxInvites={concert.maxInvites}
              confirmedCount={confirmedCount}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
