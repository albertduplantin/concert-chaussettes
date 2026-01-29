import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/api-error";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_NAME = "authjs.session-token";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Supprimer le cookie avec les mêmes options de sécurité
    cookieStore.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0), // Double suppression pour compatibilité
    });

    // Supprimer aussi tout cookie legacy potentiel
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "signout");
  }
}
