import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OrganisateurProfileForm } from "@/components/forms/organisateur-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, FileText } from "lucide-react";

export default async function OrganisateurProfilPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
  });

  if (!organisateur) {
    redirect("/onboarding/role");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <User className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Mon profil
          </h1>
          <p className="text-white/90 max-w-xl">
            Complétez votre profil pour personnaliser votre expérience et améliorer vos invitations.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar with tips */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" />
                Pourquoi compléter ?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                <strong className="text-foreground">Personnalisation</strong><br />
                Vos invitations peuvent inclure votre nom et localisation.
              </p>
              <p>
                <strong className="text-foreground">Crédibilité</strong><br />
                Les groupes voient qui organise les concerts.
              </p>
              <p>
                <strong className="text-foreground">Recherche locale</strong><br />
                Trouvez des groupes près de chez vous plus facilement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Astuce localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Indiquez votre ville pour voir les groupes disponibles dans votre région en priorité.
            </CardContent>
          </Card>
        </div>

        {/* Main form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                Ces informations sont utilisées pour personnaliser votre expérience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganisateurProfileForm organisateur={organisateur} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
