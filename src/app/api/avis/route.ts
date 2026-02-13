import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { avis, concerts, organisateurs, groupes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { notifyAvisReceived } from "@/lib/email";

const schema = z.object({
  groupeId: z.string().uuid(),
  concertId: z.string().uuid(),
  note: z.number().int().min(1).max(5),
  commentaire: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true, nom: true },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { groupeId, concertId, note, commentaire } = parsed.data;

  // Verify the concert belongs to this organisateur and is PASSE
  const concert = await db.query.concerts.findFirst({
    where: and(
      eq(concerts.id, concertId),
      eq(concerts.organisateurId, organisateur.id)
    ),
    columns: { id: true, status: true, groupeId: true, titre: true },
  });
  if (!concert) {
    return NextResponse.json({ error: "Concert introuvable" }, { status: 404 });
  }
  if (concert.status !== "PASSE") {
    return NextResponse.json({ error: "Le concert n'est pas encore terminé" }, { status: 400 });
  }
  if (concert.groupeId !== groupeId) {
    return NextResponse.json({ error: "Ce groupe n'a pas joué à ce concert" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await db.query.avis.findFirst({
    where: and(eq(avis.concertId, concertId), eq(avis.auteurEmail, session.user.email)),
    columns: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce concert" }, { status: 409 });
  }

  const [created] = await db.insert(avis).values({
    groupeId,
    concertId,
    auteurType: "ORGANISATEUR",
    auteurEmail: session.user.email,
    auteurNom: organisateur.nom,
    note,
    commentaire: commentaire || null,
  }).returning({ id: avis.id });

  // Email notification (fire-and-forget)
  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.id, groupeId),
    columns: { contactEmail: true, nom: true },
  });
  if (groupe?.contactEmail) {
    notifyAvisReceived({
      groupeContactEmail: groupe.contactEmail,
      groupeNom: groupe.nom,
      auteurNom: organisateur.nom,
      auteurType: "ORGANISATEUR",
      note,
      commentaire: commentaire || null,
      concertTitre: concert.titre,
    }).catch(() => {});
  }

  return NextResponse.json({ id: created.id });
}
