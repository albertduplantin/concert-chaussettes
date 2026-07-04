import { db } from "@/lib/db";
import { avis } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export interface Souvenir {
  url: string;
  concertTitre: string;
  auteurNom: string | null;
}

/**
 * Récupère les liens photos/vidéos (mediaUrls) partagés par les invités
 * lors des avis laissés sur les concerts donnés. Pas de fichiers hébergés :
 * uniquement des liens vers des albums/vidéos déjà en ligne (Google Photos,
 * YouTube, Instagram...).
 */
export async function getConcertSouvenirs(concertIds: string[], limit = 12): Promise<Souvenir[]> {
  if (concertIds.length === 0) return [];

  const rows = await db.query.avis.findMany({
    where: and(inArray(avis.concertId, concertIds), eq(avis.isVisible, true)),
    columns: { mediaUrls: true, auteurNom: true },
    with: {
      concert: { columns: { titre: true } },
    },
  });

  const souvenirs: Souvenir[] = [];
  for (const row of rows) {
    for (const url of row.mediaUrls || []) {
      souvenirs.push({ url, concertTitre: row.concert?.titre || "Concert", auteurNom: row.auteurNom });
      if (souvenirs.length >= limit) return souvenirs;
    }
  }
  return souvenirs;
}
