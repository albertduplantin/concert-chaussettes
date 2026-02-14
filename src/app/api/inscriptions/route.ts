import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { concerts, inscriptions, contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inscriptionSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import { notifyInscription } from "@/lib/email";
import crypto from "crypto";

// Generate a secure management token
function generateManagementToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation avec schema renforce
    const result = inscriptionSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Donnees invalides")
      );
    }

    const data = result.data;

    // Sanitization des donnees
    const sanitizedEmail = sanitizeEmail(data.email);
    const sanitizedNom = sanitizeText(data.nom);
    const sanitizedPrenom = data.prenom ? sanitizeText(data.prenom) : null;
    const sanitizedPhone = data.telephone ? sanitizePhone(data.telephone) : null;

    // Verifier que le concert existe et est publie
    const concert = await db.query.concerts.findFirst({
      where: and(
        eq(concerts.id, data.concertId),
        eq(concerts.status, "PUBLIE")
      ),
      with: {
        inscriptions: { columns: { email: true, status: true, nombrePersonnes: true } },
        organisateur: {
          columns: { id: true },
          with: { user: { columns: { email: true } } },
        },
      },
    });

    if (!concert) {
      return apiErrorResponse(ApiError.notFound("Concert non trouve ou non publie"));
    }

    // Verifier si l'email est deja inscrit
    const existingInscription = concert.inscriptions.find(
      (i) => i.email.toLowerCase() === sanitizedEmail && i.status !== "ANNULE"
    );

    if (existingInscription) {
      return apiErrorResponse(ApiError.conflict("Vous etes deja inscrit a ce concert"));
    }

    // Calculer les places confirmees
    const confirmedCount = concert.inscriptions
      .filter((i) => i.status === "CONFIRME")
      .reduce((sum, i) => sum + i.nombrePersonnes, 0);

    const isFull = concert.maxInvites
      ? confirmedCount + data.nombrePersonnes > concert.maxInvites
      : false;

    // Generate tokens
    const managementToken = generateManagementToken();
    const reviewToken = crypto.randomBytes(32).toString("hex");

    // Creer l'inscription avec donnees sanitizees
    const [inscription] = await db
      .insert(inscriptions)
      .values({
        concertId: data.concertId,
        nom: sanitizedNom,
        prenom: sanitizedPrenom,
        email: sanitizedEmail,
        telephone: sanitizedPhone,
        nombrePersonnes: data.nombrePersonnes,
        status: isFull ? "LISTE_ATTENTE" : "CONFIRME",
        managementToken,
        reviewToken,
        showInGuestList: true,
      })
      .returning();

    // Ajouter/mettre a jour le contact dans le CRM de l'organisateur
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

    // Build management URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app";
    const managementUrl = `${baseUrl}/inscription/${inscription.id}?token=${managementToken}`;

    // Email notifications (fire-and-forget)
    notifyInscription({
      guestNom: sanitizedNom,
      guestPrenom: sanitizedPrenom,
      guestEmail: sanitizedEmail,
      nombrePersonnes: data.nombrePersonnes,
      status: inscription.status as "CONFIRME" | "LISTE_ATTENTE",
      managementUrl,
      concertTitre: concert.titre,
      concertDate: concert.date,
      concertVille: concert.ville,
      concertAdressePublique: concert.adressePublique,
      organisateurEmail: concert.organisateur.user.email,
    }).catch(() => {});

    // Return inscription without exposing token directly, but include management URL
    return NextResponse.json({
      inscription: {
        id: inscription.id,
        status: inscription.status,
        nombrePersonnes: inscription.nombrePersonnes,
      },
      managementUrl,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "inscription");
  }
}
