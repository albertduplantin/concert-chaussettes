import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { token, email } = await req.json();

  if (!token || !email) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, `verify:${email}`),
      eq(verificationTokens.token, token)
    ),
  });

  if (!record) {
    return NextResponse.json({ error: "Lien invalide ou déjà utilisé" }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(and(
        eq(verificationTokens.identifier, `verify:${email}`),
        eq(verificationTokens.token, token)
      ));
    return NextResponse.json({ error: "Lien expiré" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(and(
      eq(verificationTokens.identifier, `verify:${email}`),
      eq(verificationTokens.token, token)
    ));

  return NextResponse.json({ success: true });
}
