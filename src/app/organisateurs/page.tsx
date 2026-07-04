import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrganisateursSearch } from "./organisateurs-search";

export const revalidate = 120;

export default function OrganisateursPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <Header />

      {/* Hero */}
      <section className="py-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Trouvez un lieu pour jouer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez des organisateurs qui ouvrent leur salon près de chez vous
          </p>
        </div>
      </section>

      <OrganisateursSearch />

      <Footer />
    </div>
  );
}
