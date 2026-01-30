import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

const COOKIE_NAME = "authjs.session-token";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Configuration sécurisée des cookies
 */
const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("strict" as const) : ("lax" as const),
  path: "/",
};

/**
 * Supprime le cookie de session de manière sécurisée
 */
function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

/**
 * Vérifie et décode le token JWT
 */
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);

    // Vérifier que le payload contient les champs requis
    if (!payload.id && !payload.sub) {
      return null;
    }
    if (!payload.email || !payload.role) {
      return null;
    }

    return {
      id: (payload.id || payload.sub) as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let user: { id: string; email: string; role: string } | null = null;

  if (token) {
    user = await verifyToken(token);

    // Token invalide ou expiré - supprimer le cookie corrompu
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      clearSessionCookie(response);
      return response;
    }
  }

  const isLoggedIn = !!user;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isHomePage = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Ne pas interférer avec les routes d'authentification API
  if (isApiAuth) {
    return NextResponse.next();
  }

  // Rediriger les utilisateurs connectés depuis la page d'accueil ou les pages auth vers leur dashboard
  if (isLoggedIn && (isHomePage || isAuthPage)) {
    const dashboardPath =
      user?.role === "GROUPE"
        ? "/dashboard/groupe"
        : user?.role === "ADMIN"
          ? "/admin"
          : "/dashboard/organisateur";
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  // Protéger le dashboard
  if (isDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protéger l'admin - seuls les ADMIN peuvent accéder
  if (isAdmin) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Ajouter des headers de sécurité
  const response = NextResponse.next();

  // Headers de sécurité
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*", "/admin/:path*"],
};
