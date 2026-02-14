export const revalidate = 120;

import { db } from "@/lib/db";
import { genres } from "@/lib/db/schema";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GroupesSearch } from "./groupes-search";

export default async function GroupesPage() {
  // Fetch available genres for filtering
  const allGenres = await db.query.genres.findMany({
    columns: { id: true, nom: true },
    orderBy: (genres, { asc }) => [asc(genres.nom)],
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <Header />

      {/* Hero */}
      <section className="py-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Trouvez votre groupe
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez des artistes talentueux près de chez vous pour vos concerts privés
          </p>
        </div>
      </section>

      {/* Search component */}
      <GroupesSearch genres={allGenres} />

      <Footer />
    </div>
  );
}
