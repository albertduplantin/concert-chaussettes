import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

/**
 * Configuration des limites d'upload
 */
export const UPLOAD_CONFIG = {
  // Limites de taille
  maxFileSize: "2MB" as const,
  maxFileSizeBytes: 2 * 1024 * 1024, // 2 MB

  // Dimensions maximales (redimensionnement automatique)
  maxWidth: 1920,
  maxHeight: 1080,

  // Qualité de compression WebP
  quality: 80,

  // Types de fichiers acceptés
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],

  // Limites par plan
  limits: {
    FREE: {
      maxPhotos: 3,
      maxVideos: 3,
    },
    PREMIUM: {
      maxPhotos: 10,
      maxVideos: 5,
    },
  },
} as const;

/**
 * Vérifie si un type de fichier est accepté
 */
export function isAcceptedFileType(type: string): boolean {
  return (UPLOAD_CONFIG.acceptedTypes as readonly string[]).includes(type);
}

/**
 * Formate la taille de fichier pour l'affichage
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
