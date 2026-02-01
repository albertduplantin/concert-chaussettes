import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    // Check admin authorization
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const allGroupes = await db.query.groupes.findMany({
      orderBy: [desc(groupes.createdAt)],
      columns: {
        id: true,
        nom: true,
        ville: true,
        departement: true,
        isVerified: true,
        isBoosted: true,
        isVisible: true,
        createdAt: true,
      },
      with: {
        user: {
          columns: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ groupes: allGroupes });
  } catch (error) {
    console.error("Error fetching groupes:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
