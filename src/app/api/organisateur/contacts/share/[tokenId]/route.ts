import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactShareTokens, organisateurs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { tokenId } = await params;

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  await db.update(contactShareTokens)
    .set({ isRevoked: true })
    .where(
      and(
        eq(contactShareTokens.id, tokenId),
        eq(contactShareTokens.organisateurId, organisateur.id)
      )
    );

  return NextResponse.json({ success: true });
}
