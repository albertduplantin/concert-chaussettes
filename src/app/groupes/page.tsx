export const revalidate = 120;

import { db } from "@/lib/db";
import { genres } from "@/lib/db/schema";
import Image from "next/image";
import Link from "next/link";
import { GroupesSearch } from "./groupes-search";

export default async function GroupesPage() {
  // Fetch available genres for filtering
  const allGenres = await db.query.genres.findMany({
    columns: { id: true, nom: true },
    orderBy: (genres, { asc }) => [asc(genres.nom)],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="Concert Chaussettes"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-lg hidden sm:inline">Concert Chaussettes</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Connexion
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Trouvez votre groupe
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Decouvrez des artistes talentueux pres de chez vous pour vos concerts prives
          </p>
        </div>
      </section>

      {/* Search component */}
      <GroupesSearch genres={allGenres} />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Concert Chaussettes"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-white/60 text-sm">Concert Chaussettes</span>
            </div>
            <p className="text-white/40 text-sm">
              Concerts prives et intimes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
