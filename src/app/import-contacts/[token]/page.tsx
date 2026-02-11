import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactShareTokens, contacts } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { ImportContactsClient } from "./client";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

export default async function ImportContactsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await getSession();
  const { token } = await params;

  if (!session) {
    redirect(`/login?callbackUrl=/import-contacts/${token}`);
  }

  if (session.user.role !== "ORGANISATEUR") {
    redirect("/dashboard");
  }

  const shareToken = await db.query.contactShareTokens.findFirst({
    where: and(
      eq(contactShareTokens.token, token),
      eq(contactShareTokens.isRevoked, false),
      gt(contactShareTokens.expiresAt, new Date())
    ),
    columns: { id: true, organisateurId: true, label: true, maxUses: true, usedCount: true, expiresAt: true },
  });

  if (!shareToken) {
    return (
      <ImportContactsClient
        token={token}
        preview={null}
        error="Ce lien est invalide ou a expiré."
      />
    );
  }

  if (shareToken.maxUses !== null && shareToken.usedCount >= shareToken.maxUses) {
    return (
      <ImportContactsClient
        token={token}
        preview={null}
        error="Ce lien a atteint sa limite d'utilisations."
      />
    );
  }

  const allContacts = await db
    .select({ nom: contacts.nom, email: contacts.email })
    .from(contacts)
    .where(eq(contacts.organisateurId, shareToken.organisateurId));

  const preview = {
    organisateurNom: shareToken.label || "Un organisateur",
    contactsCount: allContacts.length,
    preview: allContacts.slice(0, 5).map((c) => ({
      nom: c.nom || "—",
      emailMasked: maskEmail(c.email),
    })),
    expiresAt: shareToken.expiresAt,
  };

  return <ImportContactsClient token={token} preview={preview} error={null} />;
}
