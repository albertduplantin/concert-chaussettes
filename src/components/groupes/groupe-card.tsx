"use client";

import { useState, useRef } from "react";
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
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Youtube,
  CheckCircle,
  Zap,
  CalendarPlus,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Music2,
  Play,
  Send,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    concertsCount?: number;
    rating?: number;
  };
}

export function GroupeCard({ groupe }: GroupeCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayImage = groupe.thumbnailUrl || groupe.photos[0];
  const hasVideo = groupe.youtubeVideos.length > 0;

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
    setLightboxIndex(
      (prev) => (prev - 1 + groupe.photos.length) % groupe.photos.length
    );
  }

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hasVideo) {
      // Small delay before showing video
      hoverTimeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, 500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowVideo(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Card
            className={cn(
              "cursor-pointer relative overflow-hidden transition-all duration-300",
              "hover:shadow-xl hover:-translate-y-1",
              groupe.isBoosted && "ring-2 ring-orange-400/50"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Media Section */}
            <div className="relative h-48 w-full bg-muted overflow-hidden">
              {displayImage && !showVideo ? (
                <>
                  <Image
                    src={displayImage}
                    alt={groupe.nom}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-500",
                      isHovered && "scale-110"
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : showVideo && hasVideo ? (
                <div className="w-full h-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${groupe.youtubeVideos[0]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${groupe.youtubeVideos[0]}`}
                    title="Video preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-full h-full"
                    style={{ pointerEvents: "none" }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Music2 className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Badges top */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  {groupe.isBoosted && (
                    <Badge className="gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-md">
                      <Zap className="h-3 w-3" />
                      Mis en avant
                    </Badge>
                  )}
                  {groupe.isVerified && (
                    <Badge className="gap-1 bg-blue-500 text-white border-0 shadow-md">
                      <CheckCircle className="h-3 w-3" />
                      Vérifié
                    </Badge>
                  )}
                </div>
                {hasVideo && !showVideo && (
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Stats badges bottom */}
              <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                {groupe.rating && groupe.rating > 0 && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-black/60 backdrop-blur-sm text-white border-0"
                  >
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {groupe.rating.toFixed(1)}
                  </Badge>
                )}
                {groupe.concertsCount && groupe.concertsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-black/60 backdrop-blur-sm text-white border-0"
                  >
                    <Music2 className="h-3 w-3" />
                    {groupe.concertsCount} concert{groupe.concertsCount > 1 ? "s" : ""}
                  </Badge>
                )}
                {hasVideo && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-black/60 backdrop-blur-sm text-white border-0"
                  >
                    <Youtube className="h-3 w-3" />
                    {groupe.youtubeVideos.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Content */}
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                {groupe.nom}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pb-4">
              {(groupe.ville || groupe.departement) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {[groupe.ville, groupe.departement].filter(Boolean).join(", ")}
                </div>
              )}

              {groupe.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {groupe.genres.slice(0, 3).map((genre) => (
                    <Badge
                      key={genre.id}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {genre.nom}
                    </Badge>
                  ))}
                  {groupe.genres.length > 3 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      +{groupe.genres.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {groupe.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {groupe.bio}
                </p>
              )}

              {/* Quick action on hover */}
              <div
                className={cn(
                  "pt-2 transition-all duration-300",
                  isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                <Button
                  size="sm"
                  className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Send className="h-4 w-4" />
                  Contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        {/* Dialog avec détails complets */}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {groupe.nom}
              <div className="flex gap-2">
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
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 py-3 px-4 bg-muted/50 rounded-lg">
              {groupe.rating && groupe.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{groupe.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
              )}
              {groupe.concertsCount && groupe.concertsCount > 0 && (
                <div className="flex items-center gap-2">
                  <Music2 className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{groupe.concertsCount}</span>
                  <span className="text-sm text-muted-foreground">
                    concert{groupe.concertsCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {(groupe.ville || groupe.departement || groupe.region) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    {[groupe.ville, groupe.departement, groupe.region]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Genres */}
            {groupe.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groupe.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.nom}
                  </Badge>
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
                      className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary group"
                    >
                      <Image
                        src={photo}
                        alt={`${groupe.nom} - Photo ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                <h3 className="font-semibold mb-2">Présentation</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {groupe.bio}
                </p>
              </div>
            )}

            {/* Vidéos */}
            {groupe.youtubeVideos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Vidéos</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors sm:col-span-2"
                  >
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <Globe className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm truncate">{groupe.contactSite}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Bouton créer concert */}
            <div className="pt-4 border-t flex gap-3">
              <Button asChild className="flex-1 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <Link
                  href={`/dashboard/organisateur/concerts/new?groupeId=${groupe.id}`}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Créer un concert
                </Link>
              </Button>
              {groupe.contactEmail && (
                <Button variant="outline" asChild className="gap-2">
                  <a href={`mailto:${groupe.contactEmail}`}>
                    <Mail className="h-4 w-4" />
                    Contacter
                  </a>
                </Button>
              )}
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
