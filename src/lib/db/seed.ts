import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { genres } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const defaultGenres = [
  "Rock",
  "Pop",
  "Jazz",
  "Blues",
  "Folk",
  "Classique",
  "Chanson française",
  "Reggae",
  "Soul",
  "Funk",
  "Électro",
  "Hip-hop",
  "Metal",
  "Punk",
  "Indie",
  "World",
  "Bossa Nova",
  "Swing",
  "Acoustic",
  "Singer-songwriter",
];

async function seed() {
  console.log("Seeding genres...");

  for (const nom of defaultGenres) {
    await db
      .insert(genres)
      .values({ nom, isCustom: false })
      .onConflictDoNothing();
  }

  console.log(`${defaultGenres.length} genres insérés.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erreur seed:", err);
  process.exit(1);
});
