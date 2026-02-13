import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { avis, inscriptions, concerts, groupes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { notifyAvisReceived } from "@/lib/email";

async function getInscription(reviewToken: string) {
  return db.query.inscriptions.findFirst({
    where: eq(inscriptions.reviewToken, reviewToken),
    columns: {
      id: true, nom: true, prenom: true, email: true,
      reviewedAt: true, concertId: true,
    },
    with: {
      concert: {
        columns: { id: true, titre: true, date: true, status: true, groupeId: true },
        with: {
          groupe: { columns: { id: true, nom: true, thumbnailUrl: true, contactEmail: true } },
        },
      },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewToken: string }> }
) {
  const { reviewToken } = await params;
  const inscription = await getInscription(reviewToken);

  if (!inscription) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }
  if (inscription.reviewedAt) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis" }, { status: 409 });
  }
  if (!inscription.concert.groupe) {
    return NextResponse.json({ error: "Aucun groupe associé à ce concert" }, { status: 400 });
  }

  return NextResponse.json({
    concert: {
      id: inscription.concert.id,
      titre: inscription.concert.titre,
      date: inscription.concert.date,
    },
    groupe: inscription.concert.groupe,
    auteurNom: [inscription.prenom, inscription.nom].filter(Boolean).join(" "),
  });
}

const voteSchema = z.object({
  note: z.number().int().min(1).max(5),
  commentaire: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewToken: string }> }
) {
  const { reviewToken } = await params;
  const inscription = await getInscription(reviewToken);

  if (!inscription) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }
  if (inscription.reviewedAt) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis" }, { status: 409 });
  }
  if (!inscription.concert.groupe) {
    return NextResponse.json({ error: "Aucun groupe associé à ce concert" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { note, commentaire } = parsed.data;
  const auteurNom = [inscription.prenom, inscription.nom].filter(Boolean).join(" ");

  await db.insert(avis).values({
    groupeId: inscription.concert.groupe.id,
    concertId: inscription.concertId,
    auteurType: "INVITE",
    auteurEmail: inscription.email,
    auteurNom: auteurNom || null,
    note,
    commentaire: commentaire || null,
  });

  // Mark as reviewed
  await db
    .update(inscriptions)
    .set({ reviewedAt: new Date() })
    .where(eq(inscriptions.id, inscription.id));

  // Email notification (fire-and-forget)
  if (inscription.concert.groupe.contactEmail) {
    notifyAvisReceived({
      groupeContactEmail: inscription.concert.groupe.contactEmail,
      groupeNom: inscription.concert.groupe.nom,
      auteurNom: auteurNom || null,
      auteurType: "INVITE",
      note,
      commentaire: commentaire || null,
      concertTitre: inscription.concert.titre,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
