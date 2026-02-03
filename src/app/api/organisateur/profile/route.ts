import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { organisateurProfileSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText } from "@/lib/sanitize";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "ORGANISATEUR") {
      return apiErrorResponse(
        ApiError.forbidden("Accès réservé aux organisateurs")
      );
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return apiErrorResponse(ApiError.notFound("Profil organisateur non trouvé"));
    }

    return NextResponse.json(organisateur);
  } catch (error) {
    return handleApiError(error, "récupération profil organisateur");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "ORGANISATEUR") {
      return apiErrorResponse(
        ApiError.forbidden("Seuls les organisateurs peuvent modifier leur profil")
      );
    }

    const body = await request.json();

    // Validation avec schéma
    const result = organisateurProfileSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const data = result.data;

    // Trouver l'organisateur
    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return apiErrorResponse(ApiError.notFound("Organisateur non trouvé"));
    }

    // Mettre à jour l'organisateur
    await db
      .update(organisateurs)
      .set({
        nom: sanitizeText(data.nom),
        bio: data.bio ? sanitizeText(data.bio) : null,
        ville: data.ville ? sanitizeText(data.ville) : null,
        codePostal: data.codePostal || null,
        departement: data.departement ? sanitizeText(data.departement) : null,
        region: data.region ? sanitizeText(data.region) : null,
        updatedAt: new Date(),
      })
      .where(eq(organisateurs.id, organisateur.id));

    return NextResponse.json({ message: "Profil mis à jour" });
  } catch (error) {
    return handleApiError(error, "mise à jour profil organisateur");
  }
}
