import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, groupeGenres } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateGroupeSchema = z.object({
  nom: z.string().min(1).max(255).optional(),
  ville: z.string().max(255).optional(),
  departement: z.string().max(255).optional(),
  region: z.string().max(255).optional(),
  bio: z.string().optional(),
  isVerified: z.boolean().optional(),
  isBoosted: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateGroupeSchema.parse(body);

    // Check groupe exists
    const existingGroupe = await db.query.groupes.findFirst({
      where: eq(groupes.id, id),
    });

    if (!existingGroupe) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      );
    }

    const [updatedGroupe] = await db
      .update(groupes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(groupes.id, id))
      .returning({
        id: groupes.id,
        nom: groupes.nom,
        ville: groupes.ville,
        isVerified: groupes.isVerified,
        isBoosted: groupes.isBoosted,
        isVisible: groupes.isVisible,
      });

    return NextResponse.json({ groupe: updatedGroupe });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating groupe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    // Check groupe exists
    const existingGroupe = await db.query.groupes.findFirst({
      where: eq(groupes.id, id),
    });

    if (!existingGroupe) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      );
    }

    // Delete related data first
    await db.delete(groupeGenres).where(eq(groupeGenres.groupeId, id));

    // Delete groupe
    await db.delete(groupes).where(eq(groupes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting groupe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
