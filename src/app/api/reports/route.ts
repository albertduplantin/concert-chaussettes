import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { z } from "zod/v4";

const createReportSchema = z.object({
  targetType: z.enum(["groupe", "concert"]),
  targetId: z.string().uuid(),
  reason: z.string().min(10, "Veuillez décrire le problème (10 caractères minimum)").max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const result = createReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { targetType, targetId, reason } = result.data;

    await db.insert(reports).values({
      reporterId: session.user.id,
      targetType,
      targetId,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
