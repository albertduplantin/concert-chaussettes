import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageTemplates, organisateurs, subscriptions } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { messageTemplateSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeText } from "@/lib/sanitize";

const FREE_TEMPLATES_LIMIT = 2;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "ORGANISATEUR") {
      return apiErrorResponse(
        ApiError.forbidden("Seuls les organisateurs peuvent accéder aux templates")
      );
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return apiErrorResponse(ApiError.notFound("Profil organisateur non trouvé"));
    }

    // Récupérer les templates personnels + les templates par défaut
    const allTemplates = await db.query.messageTemplates.findMany({
      where: or(
        eq(messageTemplates.organisateurId, organisateur.id),
        eq(messageTemplates.isDefault, true)
      ),
      orderBy: (templates, { desc }) => [desc(templates.isDefault), templates.nom],
    });

    return NextResponse.json({ templates: allTemplates });
  } catch (error) {
    return handleApiError(error, "récupération templates");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiErrorResponse(ApiError.unauthorized());
    }

    if (session.user.role !== "ORGANISATEUR") {
      return apiErrorResponse(
        ApiError.forbidden("Seuls les organisateurs peuvent créer des templates")
      );
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return apiErrorResponse(ApiError.notFound("Profil organisateur non trouvé"));
    }

    // Vérifier la limite freemium
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, session.user.id),
    });
    const isPremium = subscription?.plan === "PREMIUM";

    if (!isPremium) {
      const existingTemplates = await db.query.messageTemplates.findMany({
        where: eq(messageTemplates.organisateurId, organisateur.id),
      });

      if (existingTemplates.length >= FREE_TEMPLATES_LIMIT) {
        return apiErrorResponse(
          ApiError.forbidden(
            `Limite de ${FREE_TEMPLATES_LIMIT} templates atteinte. Passez en Premium pour en créer plus.`
          )
        );
      }
    }

    const body = await request.json();

    // Validation avec schéma renforcé
    const result = messageTemplateSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const data = result.data;

    // Sanitization et création du template
    const [template] = await db
      .insert(messageTemplates)
      .values({
        organisateurId: organisateur.id,
        nom: sanitizeText(data.nom),
        sujet: data.sujet ? sanitizeText(data.sujet) : null,
        contenu: sanitizeText(data.contenu),
        type: data.type,
        isDefault: false,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "création template");
  }
}
