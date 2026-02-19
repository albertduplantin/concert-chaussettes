import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { concerts, organisateurs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";

const updateConcertSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  adresseComplete: z.string().optional(),
  adressePublique: z.string().optional(),
  ville: z.string().optional(),
  groupeId: z.string().nullable().optional(),
  showGroupe: z.boolean().optional(),
  maxInvites: z.number().nullable().optional(),
  status: z.enum(["BROUILLON", "PUBLIE", "ANNULE"]).optional(),
  customBranding: z.object({
    primaryColor: z.string().optional(),
    logo: z.string().optional(),
  }).nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.user.role !== "ORGANISATEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return NextResponse.json(
        { error: "Profil organisateur non trouvé" },
        { status: 404 }
      );
    }

    const concert = await db.query.concerts.findFirst({
      where: and(
        eq(concerts.id, id),
        eq(concerts.organisateurId, organisateur.id)
      ),
      with: {
        groupe: {
          columns: { id: true, nom: true, bio: true, ville: true, region: true },
          with: {
            groupeGenres: {
              columns: { genreId: true },
              with: {
                genre: { columns: { id: true, nom: true } },
              },
            },
          },
        },
      },
    });

    if (!concert) {
      return NextResponse.json(
        { error: "Concert non trouvé" },
        { status: 404 }
      );
    }

    // Formater le groupe pour le composant GroupeSelect
    const formattedConcert = {
      ...concert,
      groupe: concert.groupe
        ? {
            id: concert.groupe.id,
            nom: concert.groupe.nom,
            bio: concert.groupe.bio,
            ville: concert.groupe.ville,
            region: concert.groupe.region,
            genres: concert.groupe.groupeGenres.map((gg) => ({
              id: gg.genre.id,
              nom: gg.genre.nom,
            })),
          }
        : null,
    };

    return NextResponse.json({ concert: formattedConcert });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.user.role !== "ORGANISATEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return NextResponse.json(
        { error: "Profil organisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le concert appartient à l'organisateur
    const existingConcert = await db.query.concerts.findFirst({
      where: and(
        eq(concerts.id, id),
        eq(concerts.organisateurId, organisateur.id)
      ),
    });

    if (!existingConcert) {
      return NextResponse.json(
        { error: "Concert non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateConcertSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const [updatedConcert] = await db
      .update(concerts)
      .set({
        ...(data.titre !== undefined && { titre: data.titre }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.adresseComplete !== undefined && { adresseComplete: data.adresseComplete || null }),
        ...(data.adressePublique !== undefined && { adressePublique: data.adressePublique || null }),
        ...(data.ville !== undefined && { ville: data.ville || null }),
        ...(data.groupeId !== undefined && { groupeId: data.groupeId }),
        ...(data.showGroupe !== undefined && { showGroupe: data.showGroupe }),
        ...(data.maxInvites !== undefined && { maxInvites: data.maxInvites }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.customBranding !== undefined && { customBranding: data.customBranding }),
        updatedAt: new Date(),
      })
      .where(eq(concerts.id, id))
      .returning();

    return NextResponse.json({ concert: updatedConcert });
  } catch {
    console.error("Erreur mise à jour concert");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.user.role !== "ORGANISATEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return NextResponse.json(
        { error: "Profil organisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le concert appartient à l'organisateur
    const existingConcert = await db.query.concerts.findFirst({
      where: and(
        eq(concerts.id, id),
        eq(concerts.organisateurId, organisateur.id)
      ),
    });

    if (!existingConcert) {
      return NextResponse.json(
        { error: "Concert non trouvé" },
        { status: 404 }
      );
    }

    await db.delete(concerts).where(eq(concerts.id, id));

    return NextResponse.json({ success: true });
  } catch {
    console.error("Erreur suppression concert");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
