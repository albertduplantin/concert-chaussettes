import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, demandesContact } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true },
  });
  if (!organisateur) return NextResponse.json({ error: "Organisateur introuvable" }, { status: 404 });

  const { id } = await req.json();

  await db
    .update(demandesContact)
    .set({ isRead: true })
    .where(and(eq(demandesContact.id, id), eq(demandesContact.organisateurId, organisateur.id)));

  return NextResponse.json({ success: true });
}
