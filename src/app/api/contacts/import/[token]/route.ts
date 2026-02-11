import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactShareTokens, contacts, organisateurs } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { token } = await params;

  const shareToken = await db.query.contactShareTokens.findFirst({
    where: and(
      eq(contactShareTokens.token, token),
      eq(contactShareTokens.isRevoked, false),
      gt(contactShareTokens.expiresAt, new Date())
    ),
    columns: { id: true, organisateurId: true, label: true, maxUses: true, usedCount: true },
  });

  if (!shareToken) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  if (shareToken.maxUses !== null && shareToken.usedCount >= shareToken.maxUses) {
    return NextResponse.json({ error: "Limite d'utilisations atteinte" }, { status: 410 });
  }

  // Get recipient's organisateur
  const recipient = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
    columns: { id: true },
  });
  if (!recipient) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Don't allow importing your own contacts
  if (shareToken.organisateurId === recipient.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas importer vos propres contacts" }, { status: 400 });
  }

  // Get source contacts
  const sourceContacts = await db
    .select({ email: contacts.email, nom: contacts.nom, telephone: contacts.telephone })
    .from(contacts)
    .where(eq(contacts.organisateurId, shareToken.organisateurId));

  const sourceLabel = `Partagé par ${shareToken.label || "un organisateur"}`;
  let imported = 0;
  let skipped = 0;

  for (const contact of sourceContacts) {
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.organisateurId, recipient.id),
        eq(contacts.email, contact.email)
      ),
      columns: { id: true },
    });

    if (!existing) {
      await db.insert(contacts).values({
        organisateurId: recipient.id,
        email: contact.email,
        nom: contact.nom,
        telephone: contact.telephone,
        sourceType: "import_partage",
        sourceLabel,
      });
      imported++;
    } else {
      skipped++;
    }
  }

  // Increment usage count
  await db.update(contactShareTokens)
    .set({ usedCount: shareToken.usedCount + 1 })
    .where(eq(contactShareTokens.id, shareToken.id));

  return NextResponse.json({ imported, skipped, total: sourceContacts.length });
}
