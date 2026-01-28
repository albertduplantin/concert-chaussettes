import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  concerts,
  organisateurs,
  subscriptions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import slugify from "slugify";
import { randomBytes } from "crypto";

const concertSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  adresseComplete: z.string().optional(),
  adressePublique: z.string().optional(),
  ville: z.string().optional(),
  groupeId: z.string().optional(),
  showGroupe: z.boolean().default(true),
  maxInvites: z.number().nullable().optional(),
  status: z.enum(["BROUILLON", "PUBLIE"]).default("BROUILLON"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "ORGANISATEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return NextResponse.json(
        { error: "Profil organisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier la limite freemium
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, session.user.id),
    });
    const isPremium = subscription?.plan === "PREMIUM";

    if (!isPremium) {
      const currentYear = new Date().getFullYear();
      const existingConcerts = await db.query.concerts.findMany({
        where: eq(concerts.organisateurId, organisateur.id),
      });
      const concertsThisYear = existingConcerts.filter(
        (c) => new Date(c.date).getFullYear() === currentYear
      );
      if (concertsThisYear.length >= 3) {
        return NextResponse.json(
          {
            error:
              "Limite de 3 concerts/an atteinte. Passez en Premium pour créer plus de concerts.",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const result = concertSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Générer un slug unique
    const baseSlug = slugify(data.titre, { lower: true, strict: true });
    const uniqueSuffix = randomBytes(4).toString("hex");
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const [concert] = await db
      .insert(concerts)
      .values({
        organisateurId: organisateur.id,
        titre: data.titre,
        description: data.description || null,
        date: new Date(data.date),
        adresseComplete: data.adresseComplete || null,
        adressePublique: data.adressePublique || null,
        ville: data.ville || null,
        groupeId: data.groupeId || null,
        showGroupe: data.showGroupe,
        maxInvites: data.maxInvites ?? null,
        slug,
        status: data.status,
      })
      .returning();

    return NextResponse.json({ concert }, { status: 201 });
  } catch {
    console.error("Erreur création concert");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
