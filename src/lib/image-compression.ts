/**
 * Utilitaire de compression d'images côté client
 * Compresse et redimensionne les images avant upload
 */

import { UPLOAD_CONFIG } from "./uploadthing";

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/webp" | "image/jpeg" | "image/png";
}

const defaultOptions: Required<CompressionOptions> = {
  maxWidth: UPLOAD_CONFIG.maxWidth,
  maxHeight: UPLOAD_CONFIG.maxHeight,
  quality: UPLOAD_CONFIG.quality / 100, // Canvas utilise 0-1
  outputType: "image/webp",
};

/**
 * Charge une image depuis un File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calcule les nouvelles dimensions en gardant le ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // Si l'image est déjà plus petite, on ne change rien
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Compresse une image et retourne un nouveau File
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...defaultOptions, ...options };

  // Si ce n'est pas une image, retourner le fichier original
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Les GIFs ne sont pas compressés (pour garder l'animation)
  if (file.type === "image/gif") {
    return file;
  }

  try {
    const img = await loadImage(file);
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight
    );

    // Créer un canvas pour le redimensionnement
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Impossible de créer le contexte canvas");
    }

    // Dessiner l'image redimensionnée
    ctx.drawImage(img, 0, 0, width, height);

    // Convertir en blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Échec de la compression"));
          }
        },
        opts.outputType,
        opts.quality
      );
    });

    // Générer le nouveau nom de fichier
    const extension = opts.outputType.split("/")[1];
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const newName = `${baseName}.${extension}`;

    // Retourner un nouveau File
    return new File([blob], newName, { type: opts.outputType });
  } catch (error) {
    console.error("[Compression] Erreur:", error);
    // En cas d'erreur, retourner le fichier original
    return file;
  }
}

/**
 * Compresse plusieurs images en parallèle
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Vérifie si un fichier est trop gros
 */
export function isFileTooLarge(file: File): boolean {
  return file.size > UPLOAD_CONFIG.maxFileSizeBytes;
}

/**
 * Vérifie si un type de fichier est une image acceptée
 */
export function isValidImageType(file: File): boolean {
  return (UPLOAD_CONFIG.acceptedTypes as readonly string[]).includes(file.type);
}
