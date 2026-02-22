import { NextRequest, NextResponse } from "next/server";
import { stripe, BOOST_DURATION_DAYS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { groupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const groupeId = session.metadata?.groupeId;
    if (!groupeId) {
      console.error("[STRIPE WEBHOOK] groupeId manquant dans metadata");
      return NextResponse.json({ error: "groupeId manquant" }, { status: 400 });
    }

    const boostExpiresAt = new Date(
      Date.now() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    await db
      .update(groupes)
      .set({ isBoosted: true, boostExpiresAt })
      .where(eq(groupes.id, groupeId));

    console.log(`[STRIPE WEBHOOK] Boost activé pour groupe ${groupeId} jusqu'au ${boostExpiresAt.toISOString()}`);
  }

  return NextResponse.json({ received: true });
}
