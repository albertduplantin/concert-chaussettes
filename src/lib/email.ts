const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const FROM_EMAIL = process.env.EMAIL_FROM || "concert-chaussettes@gmail.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Concert Chaussettes";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://concert-chaussettes.vercel.app";

// ============ LOW-LEVEL SEND ============

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[EMAIL] BREVO_API_KEY not set, skipping email to:", to);
    return;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[EMAIL] Brevo error:", res.status, body);
    }
  } catch (err) {
    console.error("[EMAIL] Failed to send email:", err);
  }
}

// ============ NOTIFICATION 1: DEVIS RECEIVED ============

interface DevisNotificationData {
  groupeContactEmail: string;
  groupeNom: string;
  requesterNom: string;
  requesterEmail: string;
  requesterTelephone: string | null;
  dateSouhaitee: string;
  nombreInvites: string | null;
  lieu: string;
  typeEvenement: string | null;
  message: string | null;
}

export async function notifyDevisReceived(
  data: DevisNotificationData
): Promise<void> {
  const html = buildDevisEmailHtml(data);
  await sendEmail(
    data.groupeContactEmail,
    `Nouvelle demande de devis pour ${data.groupeNom}`,
    html
  );
}

// ============ NOTIFICATION 2: INSCRIPTION ============

interface InscriptionNotificationData {
  guestNom: string;
  guestPrenom: string | null;
  guestEmail: string;
  nombrePersonnes: number;
  status: "CONFIRME" | "LISTE_ATTENTE";
  managementUrl: string;
  concertTitre: string;
  concertDate: Date;
  concertVille: string | null;
  concertAdressePublique: string | null;
  organisateurEmail: string;
}

export async function notifyInscription(
  data: InscriptionNotificationData
): Promise<void> {
  // Email 1: Confirmation to guest
  const guestHtml = buildInscriptionGuestEmailHtml(data);
  const statusLabel =
    data.status === "CONFIRME" ? "Confirmation" : "Liste d'attente";
  await sendEmail(
    data.guestEmail,
    `${statusLabel} — ${data.concertTitre}`,
    guestHtml
  );

  // Email 2: Notification to organizer
  const orgHtml = buildInscriptionOrganizerEmailHtml(data);
  await sendEmail(
    data.organisateurEmail,
    `Nouvelle inscription — ${data.concertTitre}`,
    orgHtml
  );
}

// ============ NOTIFICATION 3: NEW AVIS ============

interface AvisNotificationData {
  groupeContactEmail: string;
  groupeNom: string;
  auteurNom: string | null;
  auteurType: string;
  note: number;
  commentaire: string | null;
  concertTitre: string | null;
}

export async function notifyAvisReceived(
  data: AvisNotificationData
): Promise<void> {
  const html = buildAvisEmailHtml(data);
  await sendEmail(
    data.groupeContactEmail,
    `Nouvel avis pour ${data.groupeNom}`,
    html
  );
}

// ============ HTML TEMPLATES ============

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#f97316,#f59e0b);padding:24px 32px;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">Concert Chaussettes</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#18181b;margin:0 0 16px 0;font-size:18px;">${title}</h2>
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px;background-color:#f4f4f5;text-align:center;">
          <p style="color:#71717a;font-size:12px;margin:0;">
            <a href="${APP_URL}" style="color:#71717a;text-decoration:none;">Concert Chaussettes</a> — Concerts privés entre amis
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#71717a;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 16px;color:#18181b;font-size:14px;">${value}</td>
  </tr>`;
}

function formatDateFr(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function starRating(note: number): string {
  return "\u2605".repeat(note) + "\u2606".repeat(5 - note);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Devis template ---

function buildDevisEmailHtml(data: DevisNotificationData): string {
  const rows = [
    row("Nom", escapeHtml(data.requesterNom)),
    row("Email", escapeHtml(data.requesterEmail)),
    data.requesterTelephone
      ? row("Téléphone", escapeHtml(data.requesterTelephone))
      : "",
    row("Date souhaitée", formatDateFr(data.dateSouhaitee)),
    data.nombreInvites
      ? row("Nombre d'invités", escapeHtml(data.nombreInvites))
      : "",
    row("Lieu", escapeHtml(data.lieu)),
    data.typeEvenement
      ? row("Type d'événement", escapeHtml(data.typeEvenement))
      : "",
  ]
    .filter(Boolean)
    .join("");

  const messageBlock = data.message
    ? `<div style="margin-top:16px;padding:16px;background-color:#f4f4f5;border-radius:4px;">
        <p style="color:#71717a;font-size:12px;margin:0 0 8px 0;">Message :</p>
        <p style="color:#18181b;font-size:14px;margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
      </div>`
    : "";

  return baseLayout(
    "Nouvelle demande de devis",
    `<p style="color:#3f3f46;font-size:14px;">Vous avez reçu une nouvelle demande de devis pour <strong>${escapeHtml(data.groupeNom)}</strong>.</p>
     <table cellpadding="0" cellspacing="0" style="width:100%;">${rows}</table>
     ${messageBlock}
     <p style="margin-top:24px;color:#71717a;font-size:13px;">Répondez directement à <a href="mailto:${escapeHtml(data.requesterEmail)}" style="color:#f97316;">${escapeHtml(data.requesterEmail)}</a> pour donner suite à cette demande.</p>`
  );
}

// --- Inscription guest template ---

function buildInscriptionGuestEmailHtml(
  data: InscriptionNotificationData
): string {
  const isWaitlist = data.status === "LISTE_ATTENTE";
  const statusText = isWaitlist
    ? "Vous êtes sur la <strong>liste d'attente</strong>. Nous vous informerons si une place se libère."
    : "Votre inscription est <strong>confirmée</strong>.";
  const statusColor = isWaitlist ? "#f59e0b" : "#22c55e";

  const locationText =
    [data.concertAdressePublique, data.concertVille].filter(Boolean).join(", ") ||
    "À confirmer";

  return baseLayout(
    data.concertTitre,
    `<div style="padding:12px 16px;background-color:${statusColor}15;border-left:4px solid ${statusColor};border-radius:4px;margin-bottom:16px;">
       <p style="margin:0;font-size:14px;color:#18181b;">${statusText}</p>
     </div>
     <table cellpadding="0" cellspacing="0" style="width:100%;">
       ${row("Concert", escapeHtml(data.concertTitre))}
       ${row("Date", formatDateFr(data.concertDate))}
       ${row("Lieu", escapeHtml(locationText))}
       ${row("Nombre de personnes", String(data.nombrePersonnes))}
     </table>
     <div style="margin-top:24px;text-align:center;">
       <a href="${data.managementUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#f97316,#f59e0b);color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Gérer mon inscription</a>
     </div>
     <p style="margin-top:16px;color:#71717a;font-size:12px;text-align:center;">Ce lien est personnel. Ne le partagez pas.</p>`
  );
}

// --- Inscription organizer template ---

function buildInscriptionOrganizerEmailHtml(
  data: InscriptionNotificationData
): string {
  const fullName = [data.guestPrenom, data.guestNom].filter(Boolean).join(" ");
  const statusBadge =
    data.status === "CONFIRME"
      ? `<span style="background-color:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-size:12px;">Confirmé</span>`
      : `<span style="background-color:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:12px;">Liste d'attente</span>`;

  return baseLayout(
    "Nouvelle inscription",
    `<p style="color:#3f3f46;font-size:14px;"><strong>${escapeHtml(fullName)}</strong> s'est inscrit à votre concert <strong>${escapeHtml(data.concertTitre)}</strong>.</p>
     <table cellpadding="0" cellspacing="0" style="width:100%;">
       ${row("Nom", escapeHtml(fullName))}
       ${row("Email", escapeHtml(data.guestEmail))}
       ${row("Personnes", String(data.nombrePersonnes))}
       ${row("Statut", statusBadge)}
     </table>
     <div style="margin-top:24px;text-align:center;">
       <a href="${APP_URL}/dashboard/organisateur" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#f97316,#f59e0b);color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Voir le tableau de bord</a>
     </div>`
  );
}

// --- Avis template ---

function buildAvisEmailHtml(data: AvisNotificationData): string {
  const auteurLabel =
    data.auteurType === "ORGANISATEUR" ? "un organisateur" : "un invité";
  const auteurName = data.auteurNom || "Anonyme";

  return baseLayout(
    "Nouvel avis reçu",
    `<p style="color:#3f3f46;font-size:14px;">Vous avez reçu un nouvel avis de <strong>${escapeHtml(auteurName)}</strong> (${auteurLabel}) pour <strong>${escapeHtml(data.groupeNom)}</strong>.</p>
     <div style="text-align:center;margin:16px 0;">
       <span style="font-size:24px;color:#f59e0b;">${starRating(data.note)}</span>
       <p style="color:#71717a;font-size:14px;margin:4px 0 0 0;">${data.note}/5</p>
     </div>
     ${data.commentaire ? `<div style="padding:16px;background-color:#f4f4f5;border-radius:4px;">
       <p style="color:#18181b;font-size:14px;margin:0;white-space:pre-wrap;font-style:italic;">&laquo; ${escapeHtml(data.commentaire)} &raquo;</p>
     </div>` : ""}
     ${data.concertTitre ? `<p style="margin-top:12px;color:#71717a;font-size:13px;">Concert : ${escapeHtml(data.concertTitre)}</p>` : ""}
     <div style="margin-top:24px;text-align:center;">
       <a href="${APP_URL}/dashboard/groupe" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#f97316,#f59e0b);color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Voir tous les avis</a>
     </div>`
  );
}
