import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { concerts, inscriptions, contacts, organisateurs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";

const inscriptionSchema = z.object({
  concertId: z.string().uuid(),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.email("Email invalide"),
  telephone: z.string().optional(),
  nombrePersonnes: z.number().min(1).max(10).default(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = inscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

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
      return NextResponse.json(
        { error: "Concert non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà inscrit
    const existingInscription = concert.inscriptions.find(
      (i) => i.email === data.email && i.status !== "ANNULE"
    );

    if (existingInscription) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à ce concert" },
        { status: 409 }
      );
    }

    // Calculer les places confirmées
    const confirmedCount = concert.inscriptions
      .filter((i) => i.status === "CONFIRME")
      .reduce((sum, i) => sum + i.nombrePersonnes, 0);

    const isFull = concert.maxInvites
      ? confirmedCount + data.nombrePersonnes > concert.maxInvites
      : false;

    // Créer l'inscription
    const [inscription] = await db
      .insert(inscriptions)
      .values({
        concertId: data.concertId,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone || null,
        nombrePersonnes: data.nombrePersonnes,
        status: isFull ? "LISTE_ATTENTE" : "CONFIRME",
      })
      .returning();

    // Ajouter/mettre à jour le contact dans le CRM de l'organisateur
    const existingContact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.organisateurId, concert.organisateurId),
        eq(contacts.email, data.email)
      ),
    });

    if (existingContact) {
      await db
        .update(contacts)
        .set({
          nom: data.nom,
          telephone: data.telephone || existingContact.telephone,
          nombreParticipations: existingContact.nombreParticipations + 1,
          dernierConcertId: concert.id,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existingContact.id));
    } else {
      await db.insert(contacts).values({
        organisateurId: concert.organisateurId,
        email: data.email,
        nom: data.nom,
        telephone: data.telephone || null,
        nombreParticipations: 1,
        dernierConcertId: concert.id,
      });
    }

    // Log simulé pour notification
    console.log(
      `[NOTIFICATION] Nouvelle inscription: ${data.nom} (${data.email}) pour "${concert.titre}" - Status: ${inscription.status}`
    );

    return NextResponse.json({ inscription }, { status: 201 });
  } catch {
    console.error("Erreur inscription");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
