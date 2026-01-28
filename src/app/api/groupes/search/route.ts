import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupes, groupeGenres, genres } from "@/lib/db/schema";
import { eq, and, ilike, inArray, desc, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const ville = searchParams.get("ville");
    const departement = searchParams.get("departement");
    const region = searchParams.get("region");
    const genreIds = searchParams.get("genres")?.split(",").filter(Boolean);

    // Construire les conditions de filtrage
    const conditions = [eq(groupes.isVisible, true)];

    if (q) {
      conditions.push(ilike(groupes.nom, `%${q}%`));
    }
    if (ville) {
      conditions.push(ilike(groupes.ville, `%${ville}%`));
    }
    if (departement) {
      conditions.push(ilike(groupes.departement, `%${departement}%`));
    }
    if (region) {
      conditions.push(ilike(groupes.region, `%${region}%`));
    }

    // Requête de base
    let allGroupes = await db.query.groupes.findMany({
      where: and(...conditions),
      with: {
        groupeGenres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: [desc(groupes.isBoosted), asc(groupes.nom)],
    });

    // Filtrer par genres si spécifiés
    if (genreIds && genreIds.length > 0) {
      allGroupes = allGroupes.filter((g) =>
        g.groupeGenres.some((gg) => genreIds.includes(gg.genreId))
      );
    }

    // Formater la réponse
    const result = allGroupes.map((g) => ({
      id: g.id,
      nom: g.nom,
      bio: g.bio,
      ville: g.ville,
      departement: g.departement,
      region: g.region,
      youtubeVideos: g.youtubeVideos ?? [],
      contactEmail: g.contactEmail,
      contactTel: g.contactTel,
      contactSite: g.contactSite,
      isVerified: g.isVerified,
      isBoosted: g.isBoosted,
      genres: g.groupeGenres.map((gg) => ({
        id: gg.genre.id,
        nom: gg.genre.nom,
      })),
    }));

    return NextResponse.json({ groupes: result });
  } catch {
    console.error("Erreur recherche groupes");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
