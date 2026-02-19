import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verificationTokens } from "@/lib/db/schema";
import { notifyEmailVerification } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { email } = await req.json();
  if (email !== session.user.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .insert(verificationTokens)
    .values({ identifier: `verify:${email}`, token: verifyToken, expires })
    .onConflictDoUpdate({
      target: [verificationTokens.identifier, verificationTokens.token],
      set: { expires },
    });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app"}/verify-email/${verifyToken}?email=${encodeURIComponent(email)}`;
  await notifyEmailVerification(email, verifyUrl);

  return NextResponse.json({ success: true });
}
