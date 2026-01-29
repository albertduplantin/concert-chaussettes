import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, groupeGenres } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { groupeProfileSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeUrl } from "@/lib/sanitize";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "GROUPE") {
      return apiErrorResponse(
        ApiError.forbidden("Seuls les groupes peuvent modifier leur profil")
      );
    }

    const body = await request.json();

    // Validation avec schéma renforcé
    const result = groupeProfileSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const data = result.data;

    // Trouver le groupe
    const groupe = await db.query.groupes.findFirst({
      where: eq(groupes.userId, session.user.id),
    });

    if (!groupe) {
      return apiErrorResponse(ApiError.notFound("Groupe non trouvé"));
    }

    // Mettre à jour le groupe avec données sanitizées
    await db
      .update(groupes)
      .set({
        nom: sanitizeText(data.nom),
        bio: data.bio ? sanitizeText(data.bio) : null,
        ville: data.ville ? sanitizeText(data.ville) : null,
        codePostal: data.codePostal || null,
        departement: data.departement ? sanitizeText(data.departement) : null,
        region: data.region ? sanitizeText(data.region) : null,
        contactEmail: data.contactEmail ? sanitizeEmail(data.contactEmail) : null,
        contactTel: data.contactTel ? sanitizePhone(data.contactTel) : null,
        contactSite: data.contactSite ? sanitizeUrl(data.contactSite) : null,
        photos: data.photos || [], // URLs déjà validées par le schéma
        thumbnailUrl: data.thumbnailUrl || null, // URL de miniature validée
        youtubeVideos: data.youtubeVideos.filter(Boolean), // Déjà sanitizées par le schéma
        updatedAt: new Date(),
      })
      .where(eq(groupes.id, groupe.id));

    // Mettre à jour les genres
    await db.delete(groupeGenres).where(eq(groupeGenres.groupeId, groupe.id));

    if (data.genres.length > 0) {
      await db.insert(groupeGenres).values(
        data.genres.map((genreId) => ({
          groupeId: groupe.id,
          genreId,
        }))
      );
    }

    return NextResponse.json({ message: "Profil mis à jour" });
  } catch (error) {
    return handleApiError(error, "mise à jour profil groupe");
  }
}
