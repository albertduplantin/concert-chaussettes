import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactShareTokens, contacts, organisateurs } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const { token } = await params;

  const shareToken = await db.query.contactShareTokens.findFirst({
    where: and(
      eq(contactShareTokens.token, token),
      eq(contactShareTokens.isRevoked, false),
      gt(contactShareTokens.expiresAt, new Date())
    ),
    columns: { id: true, organisateurId: true, label: true, maxUses: true, usedCount: true, expiresAt: true },
  });

  if (!shareToken) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  if (shareToken.maxUses !== null && shareToken.usedCount >= shareToken.maxUses) {
    return NextResponse.json({ error: "Ce lien a atteint sa limite d'utilisations" }, { status: 410 });
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.id, shareToken.organisateurId),
    columns: { nom: true },
  });

  const allContacts = await db
    .select({ nom: contacts.nom, email: contacts.email })
    .from(contacts)
    .where(eq(contacts.organisateurId, shareToken.organisateurId));

  const preview = allContacts.slice(0, 5).map((c) => ({
    nom: c.nom || "—",
    emailMasked: maskEmail(c.email),
  }));

  return NextResponse.json({
    organisateurNom: shareToken.label || organisateur?.nom || "Un organisateur",
    contactsCount: allContacts.length,
    preview,
    expiresAt: shareToken.expiresAt,
  });
}
