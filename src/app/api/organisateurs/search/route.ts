import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organisateurs, avis } from "@/lib/db/schema";
import { eq, and, ilike, gte, inArray, asc, avg, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const ville = searchParams.get("ville");
    const departement = searchParams.get("departement");
    const region = searchParams.get("region");
    const capaciteMin = searchParams.get("capaciteMin");

    const conditions = [eq(organisateurs.isVisible, true)];

    if (q) {
      conditions.push(ilike(organisateurs.nom, `%${q}%`));
    }
    if (ville) {
      conditions.push(ilike(organisateurs.ville, `%${ville}%`));
    }
    if (departement) {
      conditions.push(ilike(organisateurs.departement, `%${departement}%`));
    }
    if (region) {
      conditions.push(ilike(organisateurs.region, `%${region}%`));
    }
    if (capaciteMin) {
      const min = parseInt(capaciteMin, 10);
      if (!isNaN(min)) conditions.push(gte(organisateurs.capaciteMax, min));
    }

    const allOrganisateurs = await db.query.organisateurs.findMany({
      where: and(...conditions),
      columns: {
        id: true,
        nom: true,
        bio: true,
        ville: true,
        departement: true,
        region: true,
        latitude: true,
        longitude: true,
        thumbnailUrl: true,
        photos: true,
        capaciteMax: true,
        equipements: true,
      },
      orderBy: [asc(organisateurs.nom)],
      limit: 500,
    });

    // Stats d'avis "cible = ORGANISATEUR"
    const organisateurIds = allOrganisateurs.map((o) => o.id);
    const avisStats =
      organisateurIds.length > 0
        ? await db
            .select({
              organisateurId: avis.organisateurId,
              avgNote: avg(avis.note),
              total: count(avis.id),
            })
            .from(avis)
            .where(
              and(
                inArray(avis.organisateurId, organisateurIds),
                eq(avis.cible, "ORGANISATEUR"),
                eq(avis.isVisible, true)
              )
            )
            .groupBy(avis.organisateurId)
        : [];

    const avisMap = new Map(avisStats.map((s) => [s.organisateurId, s]));

    const result = allOrganisateurs.map((o) => {
      const stats = avisMap.get(o.id);
      return {
        id: o.id,
        nom: o.nom,
        bio: o.bio,
        ville: o.ville,
        departement: o.departement,
        region: o.region,
        latitude: o.latitude,
        longitude: o.longitude,
        thumbnailUrl: o.thumbnailUrl,
        photos: o.photos ?? [],
        capaciteMax: o.capaciteMax,
        equipements: o.equipements ?? [],
        avgNote: stats ? Number(stats.avgNote) : null,
        avisCount: stats ? stats.total : 0,
      };
    });

    return NextResponse.json({ organisateurs: result });
  } catch {
    console.error("Erreur recherche organisateurs");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
