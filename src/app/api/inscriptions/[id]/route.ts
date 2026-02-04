import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inscriptions, concerts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateInscriptionSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText, sanitizePhone } from "@/lib/sanitize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Verify management token
async function verifyToken(id: string, token: string | null) {
  if (!token) {
    return null;
  }

  const inscription = await db.query.inscriptions.findFirst({
    where: and(
      eq(inscriptions.id, id),
      eq(inscriptions.managementToken, token)
    ),
    with: {
      concert: {
        with: {
          groupe: true,
          organisateur: true,
        },
      },
    },
  });

  return inscription;
}

// GET - Get inscription details with token verification
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get("token");

    const inscription = await verifyToken(id, token);

    if (!inscription) {
      return apiErrorResponse(ApiError.unauthorized("Lien invalide ou expire"));
    }

    // Don't expose sensitive data
    return NextResponse.json({
      inscription: {
        id: inscription.id,
        prenom: inscription.prenom,
        nom: inscription.nom,
        email: inscription.email,
        telephone: inscription.telephone,
        nombrePersonnes: inscription.nombrePersonnes,
        status: inscription.status,
        showInGuestList: inscription.showInGuestList,
        createdAt: inscription.createdAt,
      },
      concert: {
        id: inscription.concert.id,
        titre: inscription.concert.titre,
        date: inscription.concert.date,
        adressePublique: inscription.concert.adressePublique,
        slug: inscription.concert.slug,
        groupe: inscription.concert.groupe ? {
          nom: inscription.concert.groupe.nom,
          thumbnailUrl: inscription.concert.groupe.thumbnailUrl,
        } : null,
        organisateur: {
          nom: inscription.concert.organisateur.nom,
        },
      },
    });
  } catch (error) {
    return handleApiError(error, "inscription");
  }
}

// PUT - Update inscription
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get("token");

    const inscription = await verifyToken(id, token);

    if (!inscription) {
      return apiErrorResponse(ApiError.unauthorized("Lien invalide ou expire"));
    }

    // Check if concert is in the past
    if (new Date(inscription.concert.date) < new Date()) {
      return apiErrorResponse(ApiError.badRequest("Ce concert est deja passe"));
    }

    // Check if inscription is cancelled
    if (inscription.status === "ANNULE") {
      return apiErrorResponse(ApiError.badRequest("Cette inscription a ete annulee"));
    }

    const body = await request.json();
    const result = updateInscriptionSchema.safeParse(body);

    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Donnees invalides")
      );
    }

    const data = result.data;

    // Check if updating nombrePersonnes would exceed limit
    if (data.nombrePersonnes && inscription.concert.maxInvites) {
      const otherConfirmed = await db.query.inscriptions.findMany({
        where: and(
          eq(inscriptions.concertId, inscription.concertId),
          eq(inscriptions.status, "CONFIRME")
        ),
      });

      const otherCount = otherConfirmed
        .filter(i => i.id !== inscription.id)
        .reduce((sum, i) => sum + i.nombrePersonnes, 0);

      if (otherCount + data.nombrePersonnes > inscription.concert.maxInvites) {
        return apiErrorResponse(
          ApiError.badRequest(`Il ne reste que ${inscription.concert.maxInvites - otherCount} place(s) disponible(s)`)
        );
      }
    }

    // Update inscription
    const [updated] = await db
      .update(inscriptions)
      .set({
        prenom: data.prenom ? sanitizeText(data.prenom) : inscription.prenom,
        nom: data.nom ? sanitizeText(data.nom) : inscription.nom,
        telephone: data.telephone !== undefined
          ? (data.telephone ? sanitizePhone(data.telephone) : null)
          : inscription.telephone,
        nombrePersonnes: data.nombrePersonnes ?? inscription.nombrePersonnes,
        showInGuestList: data.showInGuestList ?? inscription.showInGuestList,
        updatedAt: new Date(),
      })
      .where(eq(inscriptions.id, id))
      .returning();

    return NextResponse.json({
      inscription: {
        id: updated.id,
        prenom: updated.prenom,
        nom: updated.nom,
        telephone: updated.telephone,
        nombrePersonnes: updated.nombrePersonnes,
        status: updated.status,
        showInGuestList: updated.showInGuestList,
      },
    });
  } catch (error) {
    return handleApiError(error, "inscription");
  }
}

// DELETE - Cancel inscription
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get("token");

    const inscription = await verifyToken(id, token);

    if (!inscription) {
      return apiErrorResponse(ApiError.unauthorized("Lien invalide ou expire"));
    }

    // Check if concert is in the past
    if (new Date(inscription.concert.date) < new Date()) {
      return apiErrorResponse(ApiError.badRequest("Ce concert est deja passe"));
    }

    // Check if already cancelled
    if (inscription.status === "ANNULE") {
      return apiErrorResponse(ApiError.badRequest("Cette inscription est deja annulee"));
    }

    // Cancel the inscription (soft delete)
    await db
      .update(inscriptions)
      .set({
        status: "ANNULE",
        updatedAt: new Date(),
      })
      .where(eq(inscriptions.id, id));

    // If there are people on waitlist, we could notify them here
    // For now, just log
    console.log(`[NOTIFICATION] Inscription annulee: ${inscription.nom} pour "${inscription.concert.titre}"`);

    return NextResponse.json({
      message: "Inscription annulee avec succes",
    });
  } catch (error) {
    return handleApiError(error, "inscription");
  }
}
