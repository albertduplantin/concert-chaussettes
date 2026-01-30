import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeEmail } from "@/lib/sanitize";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_NAME = "authjs.session-token";
const SESSION_DURATION_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation avec Zod
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const { email, password } = result.data;
    const sanitizedEmail = sanitizeEmail(email);

    const user = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail),
    });

    // Message générique pour éviter l'énumération des utilisateurs
    if (!user) {
      return apiErrorResponse(ApiError.unauthorized("Email ou mot de passe incorrect"));
    }

    // Si l'utilisateur n'a pas de mot de passe (compte OAuth), refuser la connexion par mot de passe
    if (!user.passwordHash) {
      return apiErrorResponse(ApiError.unauthorized("Utilisez Google pour vous connecter"));
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return apiErrorResponse(ApiError.unauthorized("Email ou mot de passe incorrect"));
    }

    // Créer un JWT session token avec claims standardisés
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      nbf: now, // Not Before - token valide immédiatement
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
      .setIssuedAt(now)
      .sign(secret);

    // Définir le cookie de session avec options sécurisées
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    return handleApiError(error, "login");
  }
}
