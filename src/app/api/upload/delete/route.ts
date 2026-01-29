import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { z } from "zod/v4";

const utapi = new UTApi();

const deleteSchema = z.object({
  url: z.string().url("URL invalide"),
});

/**
 * Extrait la clé du fichier depuis l'URL UploadThing
 * Les URLs sont au format: https://utfs.io/f/{fileKey}
 */
function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Format: https://utfs.io/f/{fileKey} ou https://ufs.sh/f/{fileKey}
    const pathParts = urlObj.pathname.split("/");
    const fIndex = pathParts.indexOf("f");
    if (fIndex !== -1 && pathParts[fIndex + 1]) {
      return pathParts[fIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    const body = await request.json();
    const result = deleteSchema.safeParse(body);

    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "URL invalide")
      );
    }

    const { url } = result.data;

    // Vérifier que l'utilisateur possède cette image
    if (session.user.role === "GROUPE") {
      const groupe = await db.query.groupes.findFirst({
        where: eq(groupes.userId, session.user.id),
      });

      if (!groupe) {
        return apiErrorResponse(ApiError.notFound("Groupe non trouvé"));
      }

      // Vérifier que l'URL fait partie des photos du groupe
      if (!groupe.photos?.includes(url)) {
        return apiErrorResponse(
          ApiError.forbidden("Vous ne pouvez pas supprimer cette image")
        );
      }

      // Supprimer l'image d'UploadThing
      const fileKey = extractFileKey(url);
      if (fileKey) {
        try {
          await utapi.deleteFiles(fileKey);
          console.log(`[UPLOAD DELETE] Fichier supprimé: ${fileKey}`);
        } catch (error) {
          console.error(`[UPLOAD DELETE] Erreur suppression UT: ${error}`);
          // Continuer même si la suppression UT échoue
        }
      }

      // Supprimer l'URL de la liste des photos
      const updatedPhotos = groupe.photos.filter((p) => p !== url);
      await db
        .update(groupes)
        .set({
          photos: updatedPhotos,
          updatedAt: new Date(),
        })
        .where(eq(groupes.id, groupe.id));

      return NextResponse.json({
        success: true,
        message: "Image supprimée",
        remainingPhotos: updatedPhotos.length,
      });
    }

    // TODO: Gérer la suppression pour les organisateurs (logo, etc.)

    return apiErrorResponse(
      ApiError.forbidden("Type d'utilisateur non supporté")
    );
  } catch (error) {
    return handleApiError(error, "suppression image");
  }
}
