import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { concerts, inscriptions, contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inscriptionSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation avec schéma renforcé
    const result = inscriptionSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const data = result.data;

    // Sanitization des données
    const sanitizedEmail = sanitizeEmail(data.email);
    const sanitizedNom = sanitizeText(data.nom);
    const sanitizedPhone = data.telephone ? sanitizePhone(data.telephone) : null;

    // Vérifier que le concert existe et est publié
    const concert = await db.query.concerts.findFirst({
      where: and(
        eq(concerts.id, data.concertId),
        eq(concerts.status, "PUBLIE")
      ),
      with: {
        inscriptions: true,
        organisateur: true,
      },
    });

    if (!concert) {
      return apiErrorResponse(ApiError.notFound("Concert non trouvé ou non publié"));
    }

    // Vérifier si l'email est déjà inscrit
    const existingInscription = concert.inscriptions.find(
      (i) => i.email.toLowerCase() === sanitizedEmail && i.status !== "ANNULE"
    );

    if (existingInscription) {
      return apiErrorResponse(ApiError.conflict("Vous êtes déjà inscrit à ce concert"));
    }

    // Calculer les places confirmées
    const confirmedCount = concert.inscriptions
      .filter((i) => i.status === "CONFIRME")
      .reduce((sum, i) => sum + i.nombrePersonnes, 0);

    const isFull = concert.maxInvites
      ? confirmedCount + data.nombrePersonnes > concert.maxInvites
      : false;

    // Créer l'inscription avec données sanitizées
    const [inscription] = await db
      .insert(inscriptions)
      .values({
        concertId: data.concertId,
        nom: sanitizedNom,
        email: sanitizedEmail,
        telephone: sanitizedPhone,
        nombrePersonnes: data.nombrePersonnes,
        status: isFull ? "LISTE_ATTENTE" : "CONFIRME",
      })
      .returning();

    // Ajouter/mettre à jour le contact dans le CRM de l'organisateur
    const existingContact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.organisateurId, concert.organisateurId),
        eq(contacts.email, sanitizedEmail)
      ),
    });

    if (existingContact) {
      await db
        .update(contacts)
        .set({
          nom: sanitizedNom,
          telephone: sanitizedPhone || existingContact.telephone,
          nombreParticipations: existingContact.nombreParticipations + 1,
          dernierConcertId: concert.id,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existingContact.id));
    } else {
      await db.insert(contacts).values({
        organisateurId: concert.organisateurId,
        email: sanitizedEmail,
        nom: sanitizedNom,
        telephone: sanitizedPhone,
        nombreParticipations: 1,
        dernierConcertId: concert.id,
      });
    }

    // Log pour notification (en prod, envoyer un vrai email)
    console.log(
      `[NOTIFICATION] Nouvelle inscription: ${sanitizedNom} (${sanitizedEmail}) pour "${concert.titre}" - Status: ${inscription.status}`
    );

    return NextResponse.json({ inscription }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "inscription");
  }
}
