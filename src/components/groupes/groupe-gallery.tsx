"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupeGalleryProps {
  photos: string[];
  groupeName: string;
}

export function GroupeGallery({ photos, groupeName }: GroupeGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function nextImage() {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  }

  function prevImage() {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-4 gap-2">
        {photos.slice(1, 5).map((photo, index) => (
          <button
            key={photo}
            onClick={() => openLightbox(index + 1)}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden",
              "hover:opacity-90 transition-opacity",
              "focus:outline-none focus:ring-2 focus:ring-orange-500",
              "group"
            )}
          >
            <Image
              src={photo}
              alt={`${groupeName} - Photo ${index + 2}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="150px"
            />
            {/* Show "+X more" on last visible thumbnail if there are more photos */}
            {index === 3 && photos.length > 5 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{photos.length - 5}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie photo"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 z-50 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 p-3 text-white hover:text-gray-300 z-50 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 p-3 text-white hover:text-gray-300 z-50 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex]}
              alt={`${groupeName} - Photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Thumbnail strip at bottom */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                key={photo}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(index);
                }}
                className={cn(
                  "relative w-16 h-16 rounded-lg overflow-hidden shrink-0 transition-all",
                  index === lightboxIndex
                    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black"
                    : "opacity-50 hover:opacity-100"
                )}
              >
                <Image
                  src={photo}
                  alt={`Miniature ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
