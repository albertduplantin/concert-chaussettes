import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inscriptions, concerts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText, sanitizePhone } from "@/lib/sanitize";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string; inscriptionId: string }>;
}

// Verify organizer owns this concert and inscription
async function verifyAccess(concertId: string, inscriptionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const concert = await db.query.concerts.findFirst({
    where: eq(concerts.id, concertId),
    with: {
      organisateur: true,
    },
  });

  if (!concert || concert.organisateur.userId !== session.user.id) {
    return null;
  }

  const inscription = await db.query.inscriptions.findFirst({
    where: and(
      eq(inscriptions.id, inscriptionId),
      eq(inscriptions.concertId, concertId)
    ),
  });

  if (!inscription) {
    return null;
  }

  return { concert, inscription };
}

// Schema for updating inscription
const updateSchema = z.object({
  prenom: z.string().min(1).max(50).optional(),
  nom: z.string().min(1).max(100).optional(),
  telephone: z.string().optional().nullable(),
  nombrePersonnes: z.number().int().min(1).max(10).optional(),
  status: z.enum(["CONFIRME", "LISTE_ATTENTE", "ANNULE"]).optional(),
});

// PUT - Update inscription
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, inscriptionId } = await params;
    const access = await verifyAccess(id, inscriptionId);

    if (!access) {
      return apiErrorResponse(ApiError.forbidden("Acces non autorise"));
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Donnees invalides")
      );
    }

    const data = result.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.prenom !== undefined) {
      updateData.prenom = sanitizeText(data.prenom);
    }
    if (data.nom !== undefined) {
      updateData.nom = sanitizeText(data.nom);
    }
    if (data.telephone !== undefined) {
      updateData.telephone = data.telephone ? sanitizePhone(data.telephone) : null;
    }
    if (data.nombrePersonnes !== undefined) {
      updateData.nombrePersonnes = data.nombrePersonnes;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const [updated] = await db
      .update(inscriptions)
      .set(updateData)
      .where(eq(inscriptions.id, inscriptionId))
      .returning();

    return NextResponse.json({
      inscription: {
        id: updated.id,
        prenom: updated.prenom,
        nom: updated.nom,
        email: updated.email,
        telephone: updated.telephone,
        nombrePersonnes: updated.nombrePersonnes,
        status: updated.status,
      },
    });
  } catch (error) {
    return handleApiError(error, "update inscription");
  }
}

// DELETE - Delete inscription permanently
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, inscriptionId } = await params;
    const access = await verifyAccess(id, inscriptionId);

    if (!access) {
      return apiErrorResponse(ApiError.forbidden("Acces non autorise"));
    }

    await db.delete(inscriptions).where(eq(inscriptions.id, inscriptionId));

    return NextResponse.json({ message: "Inscription supprimee" });
  } catch (error) {
    return handleApiError(error, "delete inscription");
  }
}
