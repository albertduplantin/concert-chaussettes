"use client";

import { useState } from "react";
import Image from "next/image";
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
import { MapPin, Mail, Phone, Globe, Youtube, CheckCircle, Zap, CalendarPlus, ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface GroupeCardProps {
  groupe: {
    id: string;
    nom: string;
    bio: string | null;
    ville: string | null;
    departement: string | null;
    region: string | null;
    photos: string[];
    thumbnailUrl: string | null;
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const displayImage = groupe.thumbnailUrl || groupe.photos[0];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function nextImage() {
    setLightboxIndex((prev) => (prev + 1) % groupe.photos.length);
  }

  function prevImage() {
    setLightboxIndex((prev) => (prev - 1 + groupe.photos.length) % groupe.photos.length);
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden">
            {/* Image miniature */}
            {displayImage ? (
              <div className="relative h-40 w-full bg-muted">
                <Image
                  src={displayImage}
                  alt={groupe.nom}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {groupe.isBoosted && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3" />
                      Mis en avant
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative h-40 w-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                {groupe.isBoosted && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3" />
                      Mis en avant
                    </Badge>
                  </div>
                )}
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
                  {groupe.youtubeVideos.length} vidéo
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

          {/* Photos */}
          {groupe.photos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {groupe.photos.map((photo, index) => (
                  <button
                    key={photo}
                    onClick={() => openLightbox(index)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Image
                      src={photo}
                      alt={`${groupe.nom} - Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </button>
                ))}
              </div>
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

          {/* Bouton créer concert */}
          <div className="pt-4 border-t">
            <Button asChild className="w-full gap-2">
              <Link href={`/dashboard/organisateur/concerts/new?groupeId=${groupe.id}`}>
                <CalendarPlus className="h-4 w-4" />
                Créer un concert avec ce groupe
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      {/* Lightbox pour les photos */}
      {lightboxOpen && groupe.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
          >
            <X className="h-8 w-8" />
          </button>

          {groupe.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 z-50"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 z-50"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl max-h-[80vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={groupe.photos[lightboxIndex]}
              alt={`${groupe.nom} - Photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {groupe.photos.length}
          </div>
        </div>
      )}
    </>
  );
}
