import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, demandesDevis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: { id: true },
  });

  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });

  const devis = await db.query.demandesDevis.findMany({
    where: eq(demandesDevis.groupeId, groupe.id),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  });

  return NextResponse.json({ devis });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const groupe = await db.query.groupes.findFirst({
    where: eq(groupes.userId, session.user.id),
    columns: { id: true },
  });

  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });

  const { id } = await req.json();

  await db
    .update(demandesDevis)
    .set({ isRead: true })
    .where(eq(demandesDevis.id, id));

  return NextResponse.json({ success: true });
}
