import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { avis, groupes } from "@/lib/db/schema";
import { eq, and, desc, avg, count, isNull } from "drizzle-orm";
import { z } from "zod";
import { notifyAvisReceived } from "@/lib/email";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupeId: string }> }
) {
  const { groupeId } = await params;

  const groupe = await db.query.groupes.findFirst({
    where: and(eq(groupes.id, groupeId), eq(groupes.isVisible, true)),
    columns: { id: true },
  });
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  }

  const [stats] = await db
    .select({
      avgNote: avg(avis.note),
      total: count(avis.id),
    })
    .from(avis)
    .where(and(eq(avis.groupeId, groupeId), eq(avis.isVisible, true)));

  const liste = await db.query.avis.findMany({
    where: and(eq(avis.groupeId, groupeId), eq(avis.isVisible, true)),
    columns: {
      id: true,
      auteurNom: true,
      auteurType: true,
      note: true,
      commentaire: true,
      createdAt: true,
    },
    orderBy: [desc(avis.createdAt)],
    limit: 20,
  });

  return NextResponse.json({
    avgNote: stats.avgNote ? parseFloat(Number(stats.avgNote).toFixed(1)) : null,
    total: Number(stats.total),
    avis: liste,
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
  { params }: { params: Promise<{ groupeId: string }> }
) {
  const { groupeId } = await params;

  const groupe = await db.query.groupes.findFirst({
    where: and(eq(groupes.id, groupeId), eq(groupes.isVisible, true)),
    columns: { id: true, contactEmail: true, nom: true },
  });
  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { email, nom, note, commentaire } = parsed.data;

  // Check duplicate : même email + même groupe + pas de concert lié
  const existing = await db.query.avis.findFirst({
    where: and(
      eq(avis.groupeId, groupeId),
      eq(avis.auteurEmail, email.toLowerCase()),
      isNull(avis.concertId)
    ),
    columns: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà laissé un avis pour ce groupe" },
      { status: 409 }
    );
  }

  await db.insert(avis).values({
    groupeId,
    concertId: null,
    auteurType: "INVITE",
    auteurEmail: email.toLowerCase(),
    auteurNom: nom || null,
    note,
    commentaire: commentaire || null,
  });

  // Email notification (fire-and-forget)
  if (groupe.contactEmail) {
    notifyAvisReceived({
      groupeContactEmail: groupe.contactEmail,
      groupeNom: groupe.nom,
      auteurNom: nom || null,
      auteurType: "INVITE",
      note,
      commentaire: commentaire || null,
      concertTitre: null,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
