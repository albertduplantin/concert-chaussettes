import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("authjs.session-token")?.value;

  let isLoggedIn = false;
  let userRole: string | undefined;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      isLoggedIn = true;
      userRole = payload.role as string;
    } catch {
      // Token invalide ou expiré - supprimer le cookie corrompu
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("authjs.session-token");
      return response;
    }
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  // Protéger le dashboard
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protéger l'admin
  if (isAdmin && (!isLoggedIn || userRole !== "ADMIN")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
