import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, email, password } = await req.json();

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
  }

  // Find token
  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, `reset:${email}`),
      eq(verificationTokens.token, token)
    ),
  });

  if (!record) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(and(
        eq(verificationTokens.identifier, `reset:${email}`),
        eq(verificationTokens.token, token)
      ));
    return NextResponse.json({ error: "Lien expiré, veuillez en demander un nouveau" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, email));

  // Delete used token
  await db
    .delete(verificationTokens)
    .where(and(
      eq(verificationTokens.identifier, `reset:${email}`),
      eq(verificationTokens.token, token)
    ));

  return NextResponse.json({ success: true });
}
