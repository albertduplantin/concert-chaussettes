import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analytics } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { type, targetId, metadata } = await req.json();

    if (!type || !targetId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const validTypes = ["PROFILE_VIEW", "CONCERT_VIEW", "INSCRIPTION"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    await db.insert(analytics).values({ type, targetId, metadata: metadata || null });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
