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
    console.log("[role] step 1: getSession");
    const session = await getSession();
    console.log("[role] step 2: session=", JSON.stringify({ id: session?.user?.id, email: session?.user?.email, role: session?.user?.role }));

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);
    console.log("[role] step 3: role=", role, "userId=", session.user.id);

    // Update user role
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));
    console.log("[role] step 4: user updated");

    // Create the appropriate profile based on role
    if (role === "GROUPE") {
      const existingGroupe = await db.query.groupes.findFirst({
        where: eq(groupes.userId, session.user.id),
      });
      console.log("[role] step 5a: existingGroupe=", existingGroupe?.id);

      if (!existingGroupe) {
        await db.insert(groupes).values({
          userId: session.user.id,
          nom: session.user.name || "Mon Groupe",
        });
        console.log("[role] step 5b: groupe inserted");
      }
    } else if (role === "ORGANISATEUR") {
      const existingOrganisateur = await db.query.organisateurs.findFirst({
        where: eq(organisateurs.userId, session.user.id),
      });
      console.log("[role] step 5a: existingOrg=", existingOrganisateur?.id);

      if (!existingOrganisateur) {
        await db.insert(organisateurs).values({
          userId: session.user.id,
          nom: session.user.name || "Mon Profil",
        });
        console.log("[role] step 5b: organisateur inserted");
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
