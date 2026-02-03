"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing, UPLOAD_CONFIG, formatFileSize } from "@/lib/uploadthing";
import { compressImage, isValidImageType } from "@/lib/image-compression";
import { Upload, X, Loader2, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ThumbnailUploaderProps {
  thumbnailUrl: string | null;
  onThumbnailChange: (url: string | null) => void;
  endpoint?: "groupeThumbnail" | "organisateurThumbnail";
  disabled?: boolean;
  className?: string;
}

export function ThumbnailUploader({
  thumbnailUrl,
  onThumbnailChange,
  endpoint = "groupeThumbnail",
  disabled = false,
  className,
}: ThumbnailUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        onThumbnailChange(res[0].url);
        toast.success("Photo de profil mise à jour");
      }
      setUploading(false);
      setProgress(0);
    },
    onUploadError: (err) => {
      setError(err.message);
      toast.error(err.message);
      setUploading(false);
      setProgress(0);
    },
    onUploadProgress: (p) => {
      setProgress(p);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      setError(null);

      const file = acceptedFiles[0];
      if (!file) return;

      if (!isValidImageType(file)) {
        setError("Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.");
        toast.error("Type de fichier non supporté");
        return;
      }

      setUploading(true);

      try {
        const compressedFile = await compressImage(file);
        console.log(
          `[Upload Thumbnail] Original: ${formatFileSize(file.size)} -> Compressé: ${formatFileSize(compressedFile.size)}`
        );
        await startUpload([compressedFile]);
      } catch (err) {
        console.error("[Upload Thumbnail] Erreur:", err);
        setError("Erreur lors de l'upload");
        setUploading(false);
      }
    },
    [disabled, startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = () => {
    onThumbnailChange(null);
    toast.success("Photo de profil supprimée");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current thumbnail preview */}
      {thumbnailUrl && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Photo actuelle :</p>
          <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-orange-500 ring-offset-2 ring-offset-background">
            <Image
              src={thumbnailUrl}
              alt="Photo de profil"
              fill
              className="object-cover"
              sizes="128px"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              title="Supprimer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          !isDragActive && "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Upload en cours... {progress}%
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {thumbnailUrl ? (
              <Upload className="h-8 w-8 text-muted-foreground" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {isDragActive
                ? "Déposez l'image ici"
                : thumbnailUrl
                ? "Changer la photo de profil"
                : "Ajouter une photo de profil"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG ou WebP • Max {UPLOAD_CONFIG.maxFileSize}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
