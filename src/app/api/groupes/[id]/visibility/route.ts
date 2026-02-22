import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "GROUPE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { isVisible } = await request.json();

  const [updated] = await db
    .update(groupes)
    .set({ isVisible })
    .where(and(eq(groupes.id, id), eq(groupes.userId, session.user.id)))
    .returning({ id: groupes.id, isVisible: groupes.isVisible });

  if (!updated) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  }

  return NextResponse.json({ isVisible: updated.isVisible });
}
