"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing, UPLOAD_CONFIG, formatFileSize } from "@/lib/uploadthing";
import { compressImage, isValidImageType } from "@/lib/image-compression";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2, ImageIcon, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages: number;
  thumbnailUrl?: string | null;
  onThumbnailChange?: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages,
  thumbnailUrl,
  onThumbnailChange,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("groupePhoto", {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        const newUrl = res[0].url;
        const newImages = [...images, newUrl];
        onImagesChange(newImages);

        // Si c'est la première image et qu'il n'y a pas de thumbnail, la définir automatiquement
        if (newImages.length === 1 && !thumbnailUrl && onThumbnailChange) {
          onThumbnailChange(newUrl);
        }

        toast.success("Photo uploadée avec succès");
      }
      setUploading([]);
    },
    onUploadError: (err) => {
      setError(err.message);
      toast.error(err.message);
      setUploading([]);
    },
    onUploadProgress: (progress) => {
      setUploading((prev) =>
        prev.map((f) => ({ ...f, progress }))
      );
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      setError(null);

      // Vérifier la limite
      if (images.length >= maxImages) {
        setError(`Limite de ${maxImages} photos atteinte`);
        toast.error(`Limite de ${maxImages} photos atteinte`);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Vérifier le type
      if (!isValidImageType(file)) {
        setError("Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.");
        toast.error("Type de fichier non supporté");
        return;
      }

      // Créer la preview
      const preview = URL.createObjectURL(file);
      setUploading([{ file, preview, progress: 0 }]);

      try {
        // Compresser l'image avant upload
        const compressedFile = await compressImage(file);
        console.log(
          `[Upload] Original: ${formatFileSize(file.size)} -> Compressé: ${formatFileSize(compressedFile.size)}`
        );

        // Lancer l'upload
        await startUpload([compressedFile]);
      } catch (err) {
        console.error("[Upload] Erreur:", err);
        setError("Erreur lors de l'upload");
        setUploading([]);
      } finally {
        URL.revokeObjectURL(preview);
      }
    },
    [disabled, images.length, maxImages, startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading || images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const urlToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Si on supprime la miniature, la réinitialiser
    if (urlToRemove === thumbnailUrl && onThumbnailChange) {
      // Définir la première image restante comme nouvelle miniature, ou null
      onThumbnailChange(newImages.length > 0 ? newImages[0] : null);
    }

    toast.success("Photo supprimée");
  };

  const setAsThumbnail = (url: string) => {
    if (onThumbnailChange) {
      onThumbnailChange(url);
      toast.success("Photo de profil définie");
    }
  };

  const remainingSlots = maxImages - images.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          !isDragActive && "border-muted-foreground/25 hover:border-primary/50",
          (disabled || images.length >= maxImages) &&
            "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Upload en cours... {uploading[0]?.progress || 0}%
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            {images.length >= maxImages ? (
              <p className="text-sm text-muted-foreground">
                Limite de {maxImages} photos atteinte
              </p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Déposez l'image ici"
                    : "Glissez une image ou cliquez pour parcourir"}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou WebP • Max {UPLOAD_CONFIG.maxFileSize} •{" "}
                  {remainingSlots} emplacement{remainingSlots > 1 ? "s" : ""} restant
                  {remainingSlots > 1 ? "s" : ""}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Indication pour la miniature */}
      {images.length > 0 && onThumbnailChange && (
        <p className="text-xs text-muted-foreground">
          Cliquez sur l&apos;étoile pour définir la photo de profil
        </p>
      )}

      {/* Preview des images uploadées */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((url, index) => {
            const isThumbnail = url === thumbnailUrl;

            return (
              <Card
                key={url}
                className={cn(
                  "relative group overflow-hidden",
                  isThumbnail && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="aspect-video relative">
                  <Image
                    src={url}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />

                  {/* Badge miniature */}
                  {isThumbnail && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Profil
                    </div>
                  )}
                </div>

                {/* Actions au survol */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Bouton définir comme miniature */}
                  {onThumbnailChange && !isThumbnail && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAsThumbnail(url)}
                      disabled={disabled}
                      title="Définir comme photo de profil"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Bouton supprimer */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                    title="Supprimer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* Placeholder pour les emplacements restants */}
          {Array.from({ length: remainingSlots }).map((_, index) => (
            <Card
              key={`placeholder-${index}`}
              className="aspect-video flex items-center justify-center bg-muted/50 border-dashed"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </Card>
          ))}
        </div>
      )}

      {/* Preview des uploads en cours */}
      {uploading.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {uploading.map((item, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={item.preview}
                  alt="Upload en cours"
                  fill
                  className="object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
