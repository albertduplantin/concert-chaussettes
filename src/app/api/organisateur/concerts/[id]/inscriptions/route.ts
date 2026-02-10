import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inscriptions, concerts, contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import crypto from "crypto";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Verify organizer owns this concert
async function verifyOrganizerAccess(concertId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const concert = await db.query.concerts.findFirst({
    where: eq(concerts.id, concertId),
    with: {
      organisateur: { columns: { userId: true } },
      inscriptions: {
        columns: {
          id: true, prenom: true, nom: true, email: true,
          telephone: true, nombrePersonnes: true, status: true,
          showInGuestList: true, createdAt: true,
        },
      },
    },
  });

  if (!concert || concert.organisateur.userId !== session.user.id) {
    return null;
  }

  return concert;
}

// GET - List all inscriptions for a concert
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const concert = await verifyOrganizerAccess(id);

    if (!concert) {
      return apiErrorResponse(ApiError.forbidden("Acces non autorise"));
    }

    const result = concert.inscriptions.map((i) => ({
      id: i.id,
      prenom: i.prenom,
      nom: i.nom,
      email: i.email,
      telephone: i.telephone,
      nombrePersonnes: i.nombrePersonnes,
      status: i.status,
      showInGuestList: i.showInGuestList,
      createdAt: i.createdAt,
    }));

    return NextResponse.json({ inscriptions: result });
  } catch (error) {
    return handleApiError(error, "list inscriptions");
  }
}

// Schema for adding inscription manually
const addInscriptionSchema = z.object({
  prenom: z.string().min(1).max(50),
  nom: z.string().min(1).max(100),
  email: z.string().email(),
  telephone: z.string().optional(),
  nombrePersonnes: z.number().int().min(1).max(10).default(1),
  status: z.enum(["CONFIRME", "LISTE_ATTENTE"]).default("CONFIRME"),
});

// POST - Add inscription manually
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const concert = await verifyOrganizerAccess(id);

    if (!concert) {
      return apiErrorResponse(ApiError.forbidden("Acces non autorise"));
    }

    const body = await request.json();
    const result = addInscriptionSchema.safeParse(body);

    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Donnees invalides")
      );
    }

    const data = result.data;
    const sanitizedEmail = sanitizeEmail(data.email);
    const sanitizedNom = sanitizeText(data.nom);
    const sanitizedPrenom = sanitizeText(data.prenom);
    const sanitizedPhone = data.telephone ? sanitizePhone(data.telephone) : null;

    // Check if already registered
    const existing = concert.inscriptions.find(
      (i) => i.email.toLowerCase() === sanitizedEmail && i.status !== "ANNULE"
    );

    if (existing) {
      return apiErrorResponse(ApiError.conflict("Cet email est deja inscrit"));
    }

    // Generate management token
    const managementToken = crypto.randomBytes(32).toString("hex");

    // Create inscription
    const [inscription] = await db
      .insert(inscriptions)
      .values({
        concertId: id,
        nom: sanitizedNom,
        prenom: sanitizedPrenom,
        email: sanitizedEmail,
        telephone: sanitizedPhone,
        nombrePersonnes: data.nombrePersonnes,
        status: data.status,
        managementToken,
        showInGuestList: true,
      })
      .returning();

    // Add to contacts
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
          dernierConcertId: id,
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
        dernierConcertId: id,
      });
    }

    return NextResponse.json({
      inscription: {
        id: inscription.id,
        prenom: inscription.prenom,
        nom: inscription.nom,
        email: inscription.email,
        telephone: inscription.telephone,
        nombrePersonnes: inscription.nombrePersonnes,
        status: inscription.status,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "add inscription");
  }
}
