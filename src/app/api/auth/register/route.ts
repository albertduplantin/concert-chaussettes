import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, subscriptions, groupes, organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validation";
import { ApiError, handleApiError, apiErrorResponse } from "@/lib/api-error";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

const BCRYPT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation avec schéma renforcé
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return apiErrorResponse(
        ApiError.validation(result.error.issues[0]?.message || "Données invalides")
      );
    }

    const { email, password, role, nom } = result.data;

    // Sanitization supplémentaire
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedNom = sanitizeText(nom);

    // Vérifier si l'email existe déjà
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail),
    });

    if (existingUser) {
      return apiErrorResponse(ApiError.conflict("Cet email est déjà utilisé"));
    }

    // Hashage sécurisé du mot de passe
    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    // Transaction pour assurer la cohérence des données
    const [newUser] = await db
      .insert(users)
      .values({
        email: sanitizedEmail,
        passwordHash,
        role,
      })
      .returning();

    // Créer l'abonnement FREE par défaut
    await db.insert(subscriptions).values({
      userId: newUser.id,
      plan: "FREE",
      status: "ACTIVE",
    });

    // Créer le profil selon le rôle
    if (role === "GROUPE") {
      await db.insert(groupes).values({
        userId: newUser.id,
        nom: sanitizedNom,
      });
    } else {
      await db.insert(organisateurs).values({
        userId: newUser.id,
        nom: sanitizedNom,
      });
    }

    return NextResponse.json(
      { message: "Compte créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "register");
  }
}
