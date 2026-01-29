import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageTemplates, organisateurs, subscriptions } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { z } from "zod/v4";

const templateSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  sujet: z.string().nullable().optional(),
  contenu: z.string().min(1, "Le contenu est requis"),
  type: z.enum(["EMAIL", "SMS", "WHATSAPP"]),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "ORGANISATEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const organisateur = await db.query.organisateurs.findFirst({
      where: eq(organisateurs.userId, session.user.id),
    });

    if (!organisateur) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
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
  } catch {
    console.error("Erreur récupération templates");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
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
      if (existingTemplates.length >= 2) {
        return NextResponse.json(
          { error: "Limite de 2 templates atteinte. Passez en Premium." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const result = templateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const [template] = await db
      .insert(messageTemplates)
      .values({
        organisateurId: organisateur.id,
        nom: data.nom,
        sujet: data.sujet ?? null,
        contenu: data.contenu,
        type: data.type,
        isDefault: false,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch {
    console.error("Erreur création template");
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
