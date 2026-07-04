import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  concerts,
  organisateurs,
  subscriptions,
} from "@/lib/db/schema";
import { and, count, eq, gte, lt } from "drizzle-orm";
import slugify from "slugify";
import { randomBytes } from "crypto";
import { concertSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText } from "@/lib/sanitize";

const FREE_CONCERTS_LIMIT_PER_YEAR = 3;
const SLUG_SUFFIX_LENGTH = 4;

/**
 * Génère un slug unique pour un concert
 */
function generateUniqueSlug(titre: string): string {
  const sanitizedTitle = sanitizeText(titre);
  const baseSlug = slugify(sanitizedTitle, {
    lower: true,
    strict: true,
    locale: "fr",
  });
  const uniqueSuffix = randomBytes(SLUG_SUFFIX_LENGTH).toString("hex");
  return `${baseSlug}-${uniqueSuffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "ORGANISATEUR") {
      return apiErrorResponse(
        ApiError.forbidden("Seuls les organisateurs peuvent créer des concerts")
      );
    }

    const [organisateur, subscription] = await Promise.all([
      db.query.organisateurs.findFirst({
        where: eq(organisateurs.userId, session.user.id),
      }),
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, session.user.id),
      }),
    ]);

    if (!organisateur) {
      return apiErrorResponse(ApiError.notFound("Profil organisateur non trouvé"));
    }

    // Vérifier la limite freemium
    const isPremium = subscription?.plan === "PREMIUM";

    if (!isPremium) {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear + 1, 0, 1);

      const [{ total: concertsThisYear }] = await db
        .select({ total: count() })
        .from(concerts)
        .where(
          and(
            eq(concerts.organisateurId, organisateur.id),
            gte(concerts.date, yearStart),
            lt(concerts.date, yearEnd)
          )
        );

      if (concertsThisYear >= FREE_CONCERTS_LIMIT_PER_YEAR) {
        return apiErrorResponse(
          ApiError.forbidden(
            `Limite de ${FREE_CONCERTS_LIMIT_PER_YEAR} concerts/an atteinte. Passez en Premium pour créer plus de concerts.`
          )
        );
      }
    }

    const body = await request.json();

    // Validation avec schéma renforcé
    const result = concertSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const data = result.data;

    // Générer un slug unique
    const slug = generateUniqueSlug(data.titre);

    // Sanitization des champs texte
    const [concert] = await db
      .insert(concerts)
      .values({
        organisateurId: organisateur.id,
        titre: sanitizeText(data.titre),
        description: data.description ? sanitizeText(data.description) : null,
        date: new Date(data.date),
        adresseComplete: data.adresseComplete ? sanitizeText(data.adresseComplete) : null,
        adressePublique: data.adressePublique ? sanitizeText(data.adressePublique) : null,
        ville: data.ville ? sanitizeText(data.ville) : null,
        groupeId: data.groupeId || null,
        showGroupe: data.showGroupe,
        maxInvites: data.maxInvites ?? null,
        slug,
        status: data.status,
      })
      .returning();

    return NextResponse.json({ concert }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "création concert");
  }
}
