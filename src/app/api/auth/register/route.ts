import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, subscriptions, groupes, organisateurs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const registerSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["GROUPE", "ORGANISATEUR"]),
  nom: z.string().min(1, "Le nom est requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, role, nom } = result.data;

    // Vérifier si l'email existe déjà
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Créer l'utilisateur
    const [newUser] = await db
      .insert(users)
      .values({
        email,
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
        nom,
      });
    } else {
      await db.insert(organisateurs).values({
        userId: newUser.id,
        nom,
      });
    }

    return NextResponse.json(
      { message: "Compte créé avec succès" },
      { status: 201 }
    );
  } catch {
    console.error("Erreur lors de l'inscription");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
