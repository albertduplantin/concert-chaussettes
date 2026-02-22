import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Vérifier que le groupe appartient bien à cet utilisateur
  const groupe = await db.query.groupes.findFirst({
    where: and(eq(groupes.id, id), eq(groupes.userId, session.user.id)),
    columns: { id: true, userId: true },
  });

  if (!groupe) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  }

  // Supprimer l'utilisateur (cascade supprime le groupe via onDelete: "cascade")
  await db.delete(users).where(eq(users.id, groupe.userId));

  return NextResponse.json({ success: true });
}
