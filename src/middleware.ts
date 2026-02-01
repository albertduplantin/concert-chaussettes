import { NextRequest, NextResponse } from "next/server";

/**
 * Récupère le token de session en vérifiant les deux noms de cookie possibles
 */
function getSessionToken(req: NextRequest): string | undefined {
  return (
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = getSessionToken(req);

  // Simple check: si le token existe, l'utilisateur est probablement connecté
  const isLoggedIn = !!token;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isHomePage = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Rediriger les utilisateurs connectés depuis la page d'accueil ou les pages auth vers leur dashboard
  if (isLoggedIn && (isHomePage || isAuthPage)) {
    // Rediriger vers /dashboard qui fera la redirection intelligente selon le rôle
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protéger le dashboard
  if (isDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protéger l'admin
  if (isAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Ajouter des headers de sécurité
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*", "/admin/:path*"],
};
