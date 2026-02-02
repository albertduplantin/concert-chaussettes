"use client";

import { useState } from "react";
import { Play, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupeVideoPlayerProps {
  videos: string[];
  groupeName: string;
}

export function GroupeVideoPlayer({ videos, groupeName }: GroupeVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(0);

  const videoId = videos[currentVideo];

  return (
    <div className="space-y-3">
      {/* Main video player */}
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={`${groupeName} - Vidéo`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <>
            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={`${groupeName} - Aperçu vidéo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to hqdefault if maxresdefault doesn't exist
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            {/* Play overlay */}
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
              aria-label="Lire la vidéo"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                <Play className="h-10 w-10 text-white fill-white ml-1" />
              </div>
            </button>
            {/* YouTube badge */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Youtube className="h-4 w-4 text-red-500" />
              <span className="text-white text-sm font-medium">YouTube</span>
            </div>
          </>
        )}
      </div>

      {/* Video selector if multiple videos */}
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {videos.slice(0, 4).map((vid, index) => (
            <button
              key={vid}
              onClick={() => {
                setCurrentVideo(index);
                setIsPlaying(false);
              }}
              className={cn(
                "relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden transition-all",
                index === currentVideo
                  ? "ring-2 ring-orange-500"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                alt={`Vidéo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
