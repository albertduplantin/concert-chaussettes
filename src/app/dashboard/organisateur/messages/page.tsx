import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, messageTemplates, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { MessageTemplatesList } from "@/components/messages/templates-list";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ORGANISATEUR") {
    redirect("/");
  }

  const organisateur = await db.query.organisateurs.findFirst({
    where: eq(organisateurs.userId, session.user.id),
  });

  if (!organisateur) redirect("/");

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });
  const isPremium = subscription?.plan === "PREMIUM";

  const templates = await db.query.messageTemplates.findMany({
    where: eq(messageTemplates.organisateurId, organisateur.id),
    orderBy: [desc(messageTemplates.createdAt)],
  });

  // Templates système (par défaut)
  const systemTemplates = await db.query.messageTemplates.findMany({
    where: eq(messageTemplates.isDefault, true),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates de messages</h1>
        <p className="text-muted-foreground mt-1">
          Cr&eacute;ez des templates pour inviter vos contacts par email, SMS ou WhatsApp
        </p>
      </div>

      <MessageTemplatesList
        templates={templates}
        systemTemplates={systemTemplates}
        isPremium={isPremium}
        organisateurId={organisateur.id}
      />
    </div>
  );
}
