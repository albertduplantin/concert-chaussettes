import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inscriptions, concerts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeEmail } from "@/lib/sanitize";
import crypto from "crypto";
import { z } from "zod";

const lookupSchema = z.object({
  email: z.string().email("Email invalide"),
  concertId: z.string().uuid("ID concert invalide"),
});

// Generate a token if missing
function generateManagementToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = lookupSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Donnees invalides")
      );
    }

    const { email, concertId } = result.data;
    const sanitizedEmail = sanitizeEmail(email);

    // Find inscription by email and concert
    const inscription = await db.query.inscriptions.findFirst({
      where: and(
        eq(inscriptions.email, sanitizedEmail),
        eq(inscriptions.concertId, concertId)
      ),
      with: {
        concert: true,
      },
    });

    if (!inscription) {
      return apiErrorResponse(
        ApiError.notFound("Aucune inscription trouvee avec cet email pour ce concert")
      );
    }

    // If inscription is cancelled, inform the user
    if (inscription.status === "ANNULE") {
      return apiErrorResponse(
        ApiError.badRequest("Cette inscription a ete annulee")
      );
    }

    // If no management token exists, create one
    let token = inscription.managementToken;
    if (!token) {
      token = generateManagementToken();
      await db
        .update(inscriptions)
        .set({ managementToken: token })
        .where(eq(inscriptions.id, inscription.id));
    }

    // Build management URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app";
    const managementUrl = `${baseUrl}/inscription/${inscription.id}?token=${token}`;

    // In production, you would send this via email
    // For now, we'll return it directly (this is less secure but more convenient for testing)
    console.log(`[LOOKUP] Inscription found for ${sanitizedEmail} - URL: ${managementUrl}`);

    return NextResponse.json({
      found: true,
      inscription: {
        id: inscription.id,
        prenom: inscription.prenom,
        nom: inscription.nom,
        status: inscription.status,
        nombrePersonnes: inscription.nombrePersonnes,
      },
      managementUrl,
    });
  } catch (error) {
    return handleApiError(error, "inscription lookup");
  }
}
