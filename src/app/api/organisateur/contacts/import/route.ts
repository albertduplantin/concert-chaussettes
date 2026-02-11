import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts, organisateurs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const importSchema = z.object({
  contacts: z.array(z.object({
    email: z.string().email(),
    nom: z.string().optional(),
    telephone: z.string().optional(),
  })).min(1).max(5000),
  source: z.string(),
  sourceLabel: z.string(),
  onDuplicate: z.enum(["ignore", "update"]).default("ignore"),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
  }

  const { contacts: incoming, source, sourceLabel, onDuplicate } = parsed.data;

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const contact of incoming) {
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.organisateurId, organisateur.id),
        eq(contacts.email, contact.email.toLowerCase())
      ),
      columns: { id: true },
    });

    if (existing) {
      if (onDuplicate === "update") {
        await db.update(contacts)
          .set({
            nom: contact.nom || undefined,
            telephone: contact.telephone || undefined,
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, existing.id));
        updated++;
      } else {
        skipped++;
      }
    } else {
      await db.insert(contacts).values({
        organisateurId: organisateur.id,
        email: contact.email.toLowerCase(),
        nom: contact.nom || null,
        telephone: contact.telephone || null,
        sourceType: source,
        sourceLabel: sourceLabel,
      });
      imported++;
    }
  }

  return NextResponse.json({ imported, updated, skipped });
}
