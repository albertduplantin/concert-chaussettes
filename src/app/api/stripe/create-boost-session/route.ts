import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe, BOOST_PRICE_EUR, BOOST_DURATION_DAYS } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "GROUPE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const groupe = await db.query.groupes.findFirst({
      where: eq(groupes.userId, session.user.id),
      columns: { id: true, nom: true, isBoosted: true, boostExpiresAt: true },
    });

    if (!groupe) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: BOOST_PRICE_EUR,
            product_data: {
              name: `Boost profil — ${BOOST_DURATION_DAYS} jours`,
              description: `Votre profil "${groupe.nom}" apparaîtra en tête des résultats de recherche pendant ${BOOST_DURATION_DAYS} jours.`,
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        groupeId: groupe.id,
        groupeNom: groupe.nom,
        userId: session.user.id,
      },
      success_url: `${APP_URL}/dashboard/groupe?boost=success`,
      cancel_url: `${APP_URL}/dashboard/groupe?boost=cancelled`,
      locale: "fr",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[STRIPE] create-boost-session error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
