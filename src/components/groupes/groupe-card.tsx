"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Mail, Phone, Globe, Youtube, CheckCircle, Zap } from "lucide-react";

interface GroupeCardProps {
  groupe: {
    id: string;
    nom: string;
    bio: string | null;
    ville: string | null;
    departement: string | null;
    region: string | null;
    youtubeVideos: string[];
    contactEmail: string | null;
    contactTel: string | null;
    contactSite: string | null;
    isVerified: boolean;
    isBoosted: boolean;
    genres: { id: string; nom: string }[];
  };
}

export function GroupeCard({ groupe }: GroupeCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow relative">
          {groupe.isBoosted && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                Mis en avant
              </Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              {groupe.nom}
              {groupe.isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(groupe.ville || groupe.departement) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[groupe.ville, groupe.departement].filter(Boolean).join(", ")}
              </div>
            )}

            {groupe.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {groupe.genres.map((genre) => (
                  <Badge key={genre.id} variant="outline" className="text-xs">
                    {genre.nom}
                  </Badge>
                ))}
              </div>
            )}

            {groupe.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {groupe.bio}
              </p>
            )}

            {groupe.youtubeVideos.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Youtube className="h-3 w-3" />
                {groupe.youtubeVideos.length} vid&eacute;o
                {groupe.youtubeVideos.length > 1 ? "s" : ""}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* Dialog avec détails complets */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {groupe.nom}
            {groupe.isVerified && (
              <CheckCircle className="h-5 w-5 text-blue-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Localisation */}
          {(groupe.ville || groupe.departement || groupe.region) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[groupe.ville, groupe.departement, groupe.region]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}

          {/* Genres */}
          {groupe.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {groupe.genres.map((genre) => (
                <Badge key={genre.id}>{genre.nom}</Badge>
              ))}
            </div>
          )}

          {/* Bio */}
          {groupe.bio && (
            <div>
              <h3 className="font-semibold mb-2">Pr&eacute;sentation</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {groupe.bio}
              </p>
            </div>
          )}

          {/* Vidéos */}
          {groupe.youtubeVideos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Vid&eacute;os</h3>
              <div className="space-y-3">
                {groupe.youtubeVideos.map((videoId) => (
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
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <div className="space-y-2">
              {groupe.contactEmail && (
                <a
                  href={`mailto:${groupe.contactEmail}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {groupe.contactEmail}
                </a>
              )}
              {groupe.contactTel && (
                <a
                  href={`tel:${groupe.contactTel}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {groupe.contactTel}
                </a>
              )}
              {groupe.contactSite && (
                <a
                  href={groupe.contactSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {groupe.contactSite}
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
