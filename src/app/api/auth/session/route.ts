import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({});
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: (session.user as { role?: string }).role || "ORGANISATEUR",
      },
    });
  } catch {
    return NextResponse.json({});
  }
}
