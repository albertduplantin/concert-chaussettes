"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CheckCircle,
  Zap,
  Youtube,
  Star,
  Music2,
  Play,
  ExternalLink,
} from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayImage = groupe.thumbnailUrl || groupe.photos[0];
  const hasVideo = groupe.youtubeVideos.length > 0;

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
    <Link href={`/groupes/${groupe.id}`} className="block group">
      <Card
        className={cn(
          "cursor-pointer relative overflow-hidden transition-all duration-300 h-full",
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
              {/* Gradient overlay on hover */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
              />
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
          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-orange-600 transition-colors">
            {groupe.nom}
            <ExternalLink
              className={cn(
                "h-4 w-4 text-muted-foreground transition-all duration-300",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              )}
            />
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

          {/* CTA on hover */}
          <div
            className={cn(
              "pt-2 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <div className="w-full text-center text-sm font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/30 py-2 rounded-lg">
              Voir le profil complet
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
