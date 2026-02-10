import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, groupes, organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["GROUPE", "ORGANISATEUR"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    // Update user role
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Create the appropriate profile based on role
    if (role === "GROUPE") {
      const existingGroupe = await db.query.groupes.findFirst({
        where: eq(groupes.userId, session.user.id),
      });

      if (!existingGroupe) {
        await db.insert(groupes).values({
          userId: session.user.id,
          nom: session.user.name || "Mon Groupe",
        });
      }
    } else if (role === "ORGANISATEUR") {
      const existingOrganisateur = await db.query.organisateurs.findFirst({
        where: eq(organisateurs.userId, session.user.id),
      });

      if (!existingOrganisateur) {
        await db.insert(organisateurs).values({
          userId: session.user.id,
          nom: session.user.name || "Mon Profil",
        });
      }
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Rôle invalide", details: error.issues },
        { status: 400 }
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error updating role:", msg, error);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
