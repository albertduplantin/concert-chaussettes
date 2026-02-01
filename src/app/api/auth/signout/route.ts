import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit";

// Tous les noms de cookies possibles utilisés par NextAuth
const COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
];

export async function POST(request: NextRequest) {
  try {
    // Récupérer la session avant de supprimer les cookies
    const session = await auth();

    const cookieStore = await cookies();

    // Supprimer tous les cookies d'authentification
    for (const cookieName of COOKIE_NAMES) {
      cookieStore.set(cookieName, "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    // Logger l'événement de déconnexion
    await logAuditEvent({
      userId: session?.user?.id || null,
      action: "logout",
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        email: session?.user?.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "signout");
  }
}
