import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UPLOAD_CONFIG } from "@/lib/uploadthing";

const f = createUploadthing();

/**
 * Middleware d'authentification pour les uploads
 */
async function authMiddleware() {
  const session = await getSession();

  if (!session) {
    throw new UploadThingError("Non autorisé - Veuillez vous connecter");
  }

  // Récupérer le plan de l'utilisateur
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const plan = subscription?.plan || "FREE";
  const limits = UPLOAD_CONFIG.limits[plan as keyof typeof UPLOAD_CONFIG.limits];

  return {
    userId: session.user.id,
    role: session.user.role,
    plan,
    limits,
  };
}

/**
 * Vérifie les limites d'upload pour les groupes
 */
async function checkGroupeLimits(userId: string, maxPhotos: number) {
  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, userId),
  });

  if (!groupe) {
    throw new UploadThingError("Profil groupe non trouvé");
  }

  const currentPhotos = groupe.photos?.length || 0;

  if (currentPhotos >= maxPhotos) {
    throw new UploadThingError(
      `Limite de ${maxPhotos} photos atteinte. ${maxPhotos === 3 ? "Passez en Premium pour plus de photos." : ""}`
    );
  }

  return {
    groupeId: groupe.id,
    currentPhotos,
    remainingSlots: maxPhotos - currentPhotos,
  };
}

export const ourFileRouter = {
  /**
   * Upload de photos pour les profils de groupes
   */
  groupePhoto: f({
    image: {
      maxFileSize: UPLOAD_CONFIG.maxFileSize,
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const auth = await authMiddleware();

      if (auth.role !== "GROUPE") {
        throw new UploadThingError("Seuls les groupes peuvent uploader des photos de profil");
      }

      const groupeData = await checkGroupeLimits(auth.userId, auth.limits.maxPhotos);

      return {
        ...auth,
        ...groupeData,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UPLOAD] Photo uploadée pour groupe ${metadata.groupeId}`);
      console.log(`[UPLOAD] URL: ${file.ufsUrl}`);

      // Ajouter la photo au profil du groupe
      const groupe = await db.query.groupes.findFirst({
        where: eq(groupes.id, metadata.groupeId),
      });

      if (groupe) {
        const currentPhotos = groupe.photos || [];
        await db
          .update(groupes)
          .set({
            photos: [...currentPhotos, file.ufsUrl],
            updatedAt: new Date(),
          })
          .where(eq(groupes.id, metadata.groupeId));
      }

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),

  /**
   * Upload multiple de photos (pour édition batch)
   */
  groupePhotoBatch: f({
    image: {
      maxFileSize: UPLOAD_CONFIG.maxFileSize,
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      const auth = await authMiddleware();

      if (auth.role !== "GROUPE") {
        throw new UploadThingError("Seuls les groupes peuvent uploader des photos");
      }

      const groupeData = await checkGroupeLimits(auth.userId, auth.limits.maxPhotos);

      return {
        ...auth,
        ...groupeData,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UPLOAD BATCH] Photo: ${file.name} pour groupe ${metadata.groupeId}`);

      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
