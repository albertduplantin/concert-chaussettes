import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notifyResetPassword } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  // Always return success to avoid email enumeration
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
    columns: { id: true, email: true, passwordHash: true },
  });

  if (user && user.passwordHash) {
    // Generate a reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store in verification_tokens (identifier = "reset:" + email)
    await db
      .insert(verificationTokens)
      .values({ identifier: `reset:${user.email}`, token, expires })
      .onConflictDoUpdate({
        target: [verificationTokens.identifier, verificationTokens.token],
        set: { expires },
      });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app"}/reset-password/${token}?email=${encodeURIComponent(user.email)}`;
    await notifyResetPassword(user.email, resetUrl);
  }

  return NextResponse.json({ success: true });
}
