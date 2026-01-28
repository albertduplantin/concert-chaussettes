import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authjs.session-token")?.value;

    if (!token) {
      return NextResponse.json({});
    }

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      user: {
        id: payload.id || payload.sub,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch {
    return NextResponse.json({});
  }
}
