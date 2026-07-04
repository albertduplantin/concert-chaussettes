import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { avis, concerts, groupes, organisateurs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { notifyAvisReceived } from "@/lib/email";

const schema = z.object({
  organisateurId: z.string().uuid(),
  concertId: z.string().uuid(),
  note: z.number().int().min(1).max(5),
  commentaire: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: { id: true, nom: true },
  });
  if (!groupe) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { organisateurId, concertId, note, commentaire } = parsed.data;

  // Vérifie que le concert appartient bien à ce groupe, à cet organisateur, et est terminé
  const concert = await db.query.concerts.findFirst({
    where: and(eq(concerts.id, concertId), eq(concerts.groupeId, groupe.id)),
    columns: { id: true, status: true, organisateurId: true, titre: true },
  });
  if (!concert) {
    return NextResponse.json({ error: "Concert introuvable" }, { status: 404 });
  }
  if (concert.status !== "PASSE") {
    return NextResponse.json({ error: "Le concert n'est pas encore terminé" }, { status: 400 });
  }
  if (concert.organisateurId !== organisateurId) {
    return NextResponse.json({ error: "Cet organisateur n'a pas organisé ce concert" }, { status: 400 });
  }

  // Un avis par email par concert (même contrainte que pour les groupes)
  const existing = await db.query.avis.findFirst({
    where: and(eq(avis.concertId, concertId), eq(avis.auteurEmail, session.user.email)),
    columns: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce concert" }, { status: 409 });
  }

  const revealAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const [created] = await db.insert(avis).values({
    groupeId: groupe.id,
    organisateurId,
    concertId,
    cible: "ORGANISATEUR",
    auteurType: "GROUPE",
    auteurEmail: session.user.email,
    auteurNom: groupe.nom,
    note,
    commentaire: commentaire || null,
    revealAt,
  }).returning({ id: avis.id });

  // Notification par email (best-effort)
  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.id, organisateurId),
    columns: { nom: true },
    with: { user: { columns: { email: true } } },
  });
  if (organisateur?.user?.email) {
    notifyAvisReceived({
      groupeContactEmail: organisateur.user.email,
      groupeNom: organisateur.nom,
      auteurNom: groupe.nom,
      auteurType: "GROUPE",
      note,
      commentaire: commentaire || null,
      concertTitre: concert.titre,
    }).catch(() => {});
  }

  return NextResponse.json({ id: created.id });
}
