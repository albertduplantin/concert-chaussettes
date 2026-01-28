import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes, groupeGenres } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const profileSchema = z.object({
  nom: z.string().min(1),
  bio: z.string().optional(),
  ville: z.string().optional(),
  codePostal: z.string().optional(),
  departement: z.string().optional(),
  region: z.string().optional(),
  contactEmail: z.string().optional(),
  contactTel: z.string().optional(),
  contactSite: z.string().optional(),
  genres: z.array(z.string()),
  youtubeVideos: z.array(z.string()),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "GROUPE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Trouver le groupe
    const groupe = await db.query.groupes.findFirst({
      where: eq(groupes.userId, session.user.id),
    });

    if (!groupe) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }

    // Mettre à jour le groupe
    await db
      .update(groupes)
      .set({
        nom: data.nom,
        bio: data.bio || null,
        ville: data.ville || null,
        codePostal: data.codePostal || null,
        departement: data.departement || null,
        region: data.region || null,
        contactEmail: data.contactEmail || null,
        contactTel: data.contactTel || null,
        contactSite: data.contactSite || null,
        youtubeVideos: data.youtubeVideos,
        updatedAt: new Date(),
      })
      .where(eq(groupes.id, groupe.id));

    // Mettre à jour les genres
    await db.delete(groupeGenres).where(eq(groupeGenres.groupeId, groupe.id));

    if (data.genres.length > 0) {
      await db.insert(groupeGenres).values(
        data.genres.map((genreId) => ({
          groupeId: groupe.id,
          genreId,
        }))
      );
    }

    return NextResponse.json({ message: "Profil mis à jour" });
  } catch {
    console.error("Erreur mise à jour profil groupe");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
