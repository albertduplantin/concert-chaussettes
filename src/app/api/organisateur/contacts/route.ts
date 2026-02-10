import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, contacts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "ORGANISATEUR") {
      return apiErrorResponse(ApiError.forbidden("Acces reserve aux organisateurs"));
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
      columns: { id: true },
    });

    if (!organisateur) {
      return apiErrorResponse(ApiError.notFound("Profil organisateur non trouve"));
    }

    const contactsList = await db.query.contacts.findMany({
      where: eq(contacts.organisateurId, organisateur.id),
      columns: { id: true, nom: true, email: true, telephone: true },
      orderBy: [asc(contacts.nom)],
    });

    return NextResponse.json({ contacts: contactsList });
  } catch (error) {
    return handleApiError(error, "contacts fetch");
  }
}
