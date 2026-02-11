import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupes, groupeGenres, genres, avis } from "@/lib/db/schema";
import { eq, and, ilike, inArray, desc, asc, avg, count } from "drizzle-orm";

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

    // Récupérer les stats d'avis pour les groupes trouvés
    const groupeIds = allGroupes.map((g) => g.id);
    const avisStats =
      groupeIds.length > 0
        ? await db
            .select({
              groupeId: avis.groupeId,
              avgNote: avg(avis.note),
              total: count(avis.id),
            })
            .from(avis)
            .where(and(inArray(avis.groupeId, groupeIds), eq(avis.isVisible, true)))
            .groupBy(avis.groupeId)
        : [];

    const avisMap = new Map(avisStats.map((s) => [s.groupeId, s]));

    // Formater la réponse
    const result = allGroupes.map((g) => {
      const stats = avisMap.get(g.id);
      return ({
      id: g.id,
      nom: g.nom,
      bio: g.bio,
      ville: g.ville,
      departement: g.departement,
      region: g.region,
      latitude: g.latitude,
      longitude: g.longitude,
      photos: g.photos ?? [],
      thumbnailUrl: g.thumbnailUrl,
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
      avgNote: stats ? Number(stats.avgNote) : null,
      avisCount: stats ? stats.total : 0,
    });
    });

    return NextResponse.json({ groupes: result });
  } catch {
    console.error("Erreur recherche groupes");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
