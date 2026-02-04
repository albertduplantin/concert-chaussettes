import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const updatedTemplates = [
  // --- EMAIL ---
  {
    nom: "Invitation concert",
    type: "EMAIL" as const,
    sujet: "🎵 Invitation : {{titre_concert}} - {{date_concert}}",
    contenu: `Bonjour,

J'ai le plaisir de vous inviter à un concert privé que j'organise chez moi :

🎤 {{titre_concert}}
📅 {{date_concert}} à {{heure_concert}}
📍 {{ville_concert}}

{{description_concert}}

Pour vous inscrire : {{lien_inscription}}

Les places sont limitées, n'attendez pas trop !

À très bientôt,
{{nom_organisateur}}`,
  },
  {
    nom: "Rappel concert (J-3)",
    type: "EMAIL" as const,
    sujet: "🎵 Rappel : {{titre_concert}} dans 3 jours !",
    contenu: `Bonjour,

Un petit rappel que le concert approche !

🎤 {{titre_concert}}
📅 {{date_concert}} à {{heure_concert}}
📍 {{adresse_complete}}

Merci de confirmer votre présence en répondant à ce mail.

À très bientôt !
{{nom_organisateur}}`,
  },
  {
    nom: "Remerciement après concert",
    type: "EMAIL" as const,
    sujet: "Merci d'être venu(e) ! 🎶",
    contenu: `Bonjour,

Merci infiniment d'avoir participé au concert {{titre_concert}} !

J'espère que vous avez passé une belle soirée. N'hésitez pas à me faire part de vos retours.

Je vous tiendrai informé(e) des prochains événements.

À bientôt !
{{nom_organisateur}}`,
  },
  // --- SMS ---
  {
    nom: "Invitation concert (SMS)",
    type: "SMS" as const,
    sujet: null,
    contenu: `🎵 Concert privé !
{{titre_concert}}
📅 {{date_concert}}
📍 {{ville_concert}}
Inscription : {{lien_inscription}}`,
  },
  {
    nom: "Rappel concert (SMS)",
    type: "SMS" as const,
    sujet: null,
    contenu: `Rappel : {{titre_concert}} c'est {{date_concert}} à {{heure_concert}} !
📍 {{adresse_complete}}
À bientôt ! 🎶`,
  },
  // --- WHATSAPP ---
  {
    nom: "Invitation concert (WhatsApp)",
    type: "WHATSAPP" as const,
    sujet: null,
    contenu: `Salut ! 👋

Je t'invite à un concert privé chez moi :

🎤 *{{titre_concert}}*
📅 {{date_concert}} à {{heure_concert}}
📍 {{ville_concert}}

{{description_concert}}

Pour t'inscrire 👉 {{lien_inscription}}

Dis-moi si tu peux venir ! 🎶`,
  },
  {
    nom: "Rappel concert (WhatsApp)",
    type: "WHATSAPP" as const,
    sujet: null,
    contenu: `Hey ! 🎵

Petit rappel pour le concert *{{titre_concert}}* !

📅 {{date_concert}} à {{heure_concert}}
📍 {{adresse_complete}}

Tu viens toujours ? Confirme-moi ! 😊`,
  },
  {
    nom: "Remerciement (WhatsApp)",
    type: "WHATSAPP" as const,
    sujet: null,
    contenu: `Merci d'être venu(e) hier soir ! 🙏🎶

J'espère que tu as passé une bonne soirée. N'hésite pas à me faire tes retours !

À très vite pour un prochain concert ! 🎤`,
  },
];

async function updateTemplates() {
  console.log("🔄 Mise à jour des templates par défaut...");

  for (const template of updatedTemplates) {
    try {
      await db
        .update(schema.messageTemplates)
        .set({
          sujet: template.sujet,
          contenu: template.contenu,
          updatedAt: new Date(),
        })
        .where(eq(schema.messageTemplates.nom, template.nom));

      console.log(`✅ Template "${template.nom}" mis à jour`);
    } catch (err) {
      console.error(`❌ Erreur pour "${template.nom}":`, err);
    }
  }

  console.log("✅ Mise à jour terminée !");
}

updateTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  });
