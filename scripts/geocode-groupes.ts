/**
 * Script one-shot : géocode tous les groupes qui ont une ville mais pas de coordonnées.
 * Usage : npx tsx scripts/geocode-groupes.ts
 */
import { db } from "../src/lib/db";
import { groupes } from "../src/lib/db/schema";
import { isNull, or, and, isNotNull } from "drizzle-orm";

async function geocode(ville: string, codePostal: string | null): Promise<{ lat: number; lng: number } | null> {
  const q = [codePostal, ville].filter(Boolean).join(" ");
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1&type=municipality`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    return { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] };
  } catch {
    return null;
  }
}

async function main() {
  const toGeocode = await db.query.groupes.findMany({
    where: and(isNotNull(groupes.ville), isNull(groupes.latitude)),
    columns: { id: true, nom: true, ville: true, codePostal: true },
  });

  console.log(`${toGeocode.length} groupes à géocoder...`);

  let success = 0;
  for (const groupe of toGeocode) {
    const coords = await geocode(groupe.ville!, groupe.codePostal);
    if (coords) {
      await db.update(groupes).set({ latitude: coords.lat, longitude: coords.lng }).where(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (await import("drizzle-orm")).eq(groupes.id, groupe.id)
      );
      console.log(`✓ ${groupe.nom} (${groupe.ville}) → ${coords.lat}, ${coords.lng}`);
      success++;
    } else {
      console.log(`✗ ${groupe.nom} (${groupe.ville}) — non trouvé`);
    }
    // Rate limiting : 1 requête / 100ms
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\nTerminé : ${success}/${toGeocode.length} géocodés.`);
  process.exit(0);
}

main().catch(console.error);
