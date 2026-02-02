import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisateurs, messageTemplates, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { MessageTemplatesList } from "@/components/messages/templates-list";
import { Mail, Sparkles } from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Mail className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Communication
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Templates de messages</h1>
          <p className="text-white/90 max-w-xl">
            Créez des templates personnalisés pour inviter vos contacts par email, SMS ou WhatsApp.
            Utilisez les variables pour personnaliser automatiquement chaque message.
          </p>
        </div>
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
