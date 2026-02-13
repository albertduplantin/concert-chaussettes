import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { avis, concerts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { notifyAvisReceived } from "@/lib/email";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ concertId: string }> }
) {
  const { concertId } = await params;

  const concert = await db.query.concerts.findFirst({
    where: eq(concerts.id, concertId),
    columns: { id: true, titre: true, date: true, status: true, groupeId: true },
    with: {
      groupe: { columns: { id: true, nom: true, thumbnailUrl: true } },
    },
  });

  if (!concert) {
    return NextResponse.json({ error: "Concert introuvable" }, { status: 404 });
  }
  if (!concert.groupe) {
    return NextResponse.json({ error: "Aucun groupe associé à ce concert" }, { status: 400 });
  }

  return NextResponse.json({
    concert: { id: concert.id, titre: concert.titre, date: concert.date },
    groupe: concert.groupe,
  });
}

const voteSchema = z.object({
  email: z.string().email(),
  nom: z.string().min(1).max(255).optional(),
  note: z.number().int().min(1).max(5),
  commentaire: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ concertId: string }> }
) {
  const { concertId } = await params;

  const concert = await db.query.concerts.findFirst({
    where: eq(concerts.id, concertId),
    columns: { id: true, status: true, groupeId: true, titre: true },
    with: {
      groupe: { columns: { id: true, nom: true, contactEmail: true } },
    },
  });

  if (!concert || !concert.groupe) {
    return NextResponse.json({ error: "Concert introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { email, nom, note, commentaire } = parsed.data;

  // Check for duplicate
  const existing = await db.query.avis.findFirst({
    where: and(eq(avis.concertId, concertId), eq(avis.auteurEmail, email.toLowerCase())),
    columns: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Un avis a déjà été soumis pour cet email et ce concert" }, { status: 409 });
  }

  await db.insert(avis).values({
    groupeId: concert.groupe.id,
    concertId,
    auteurType: "INVITE",
    auteurEmail: email.toLowerCase(),
    auteurNom: nom || null,
    note,
    commentaire: commentaire || null,
  });

  // Email notification (fire-and-forget)
  if (concert.groupe.contactEmail) {
    notifyAvisReceived({
      groupeContactEmail: concert.groupe.contactEmail,
      groupeNom: concert.groupe.nom,
      auteurNom: nom || null,
      auteurType: "INVITE",
      note,
      commentaire: commentaire || null,
      concertTitre: concert.titre,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
