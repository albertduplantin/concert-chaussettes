import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { demandesContact, groupes, organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { notifyContactReceived } from "@/lib/email";
import { sanitizeText } from "@/lib/sanitize";

const schema = z.object({
  organisateurId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  dateSouhaitee: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: { id: true, nom: true, contactEmail: true },
  });
  if (!groupe) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { organisateurId, message, dateSouhaitee } = parsed.data;

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.id, organisateurId),
    columns: { nom: true },
    with: { user: { columns: { email: true } } },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Organisateur introuvable" }, { status: 404 });
  }

  const [created] = await db
    .insert(demandesContact)
    .values({
      groupeId: groupe.id,
      organisateurId,
      message: sanitizeText(message),
      dateSouhaitee: dateSouhaitee ? new Date(dateSouhaitee) : null,
    })
    .returning({ id: demandesContact.id });

  if (organisateur.user?.email) {
    notifyContactReceived({
      organisateurEmail: organisateur.user.email,
      organisateurNom: organisateur.nom,
      groupeNom: groupe.nom,
      groupeContactEmail: groupe.contactEmail,
      message: sanitizeText(message),
      dateSouhaitee: dateSouhaitee || null,
    }).catch(() => {});
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}
