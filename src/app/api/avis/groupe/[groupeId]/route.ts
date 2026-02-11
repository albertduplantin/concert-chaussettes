import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { avis, groupes } from "@/lib/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";

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
