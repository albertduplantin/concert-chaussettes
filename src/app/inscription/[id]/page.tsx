import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { inscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ArrowLeft } from "lucide-react";
import { InscriptionManagement } from "./inscription-management";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function InscriptionManagementPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  // Verify token server-side
  const inscription = await db.query.inscriptions.findFirst({
    where: and(
      eq(inscriptions.id, id),
      eq(inscriptions.managementToken, token)
    ),
    with: {
      concert: {
        with: {
          groupe: true,
          organisateur: true,
        },
      },
    },
  });

  if (!inscription) {
    notFound();
  }

  const concert = inscription.concert;
  const isPast = new Date(concert.date) < new Date();
  const isCancelled = inscription.status === "ANNULE";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back link */}
        <Link
          href={`/concert/${concert.slug}`}
          className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au concert
        </Link>

        {/* Concert info card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-sm font-medium text-white/60 mb-2">Votre inscription pour</h2>
          <h1 className="text-2xl font-bold mb-4">{concert.titre}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-400" />
              {format(new Date(concert.date), "EEEE d MMMM yyyy", { locale: fr })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              {format(new Date(concert.date), "HH:mm", { locale: fr })}
            </div>
            {concert.adressePublique && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                {concert.adressePublique}
              </div>
            )}
          </div>

          {concert.groupe && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              {concert.groupe.thumbnailUrl ? (
                <Image
                  src={concert.groupe.thumbnailUrl}
                  alt={concert.groupe.nom}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500" />
              )}
              <span className="font-medium">{concert.groupe.nom}</span>
            </div>
          )}
        </div>

        {/* Management component */}
        <InscriptionManagement
          inscriptionId={id}
          token={token}
          initialData={{
            prenom: inscription.prenom || "",
            nom: inscription.nom,
            email: inscription.email,
            telephone: inscription.telephone || "",
            nombrePersonnes: inscription.nombrePersonnes,
            status: inscription.status,
            showInGuestList: inscription.showInGuestList ?? true,
          }}
          isPast={isPast}
          isCancelled={isCancelled}
          maxInvites={concert.maxInvites}
        />
      </main>
    </div>
  );
}
