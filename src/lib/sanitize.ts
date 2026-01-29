/**
 * Utilitaires de sanitization pour prévenir les attaques XSS
 */

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Supprime les balises HTML et scripts d'une chaîne
 */
export function stripHtml(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Sanitize une chaîne pour utilisation dans du texte
 * Supprime le HTML et normalise les espaces
 */
export function sanitizeText(str: string | undefined | null): string {
  if (!str) return "";
  return stripHtml(str)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitize une URL pour s'assurer qu'elle est sûre
 * Accepte uniquement http:, https: et les chemins relatifs
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "";

  const trimmed = url.trim();

  // Bloquer les protocoles dangereux
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
  ];

  const lowerUrl = trimmed.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return "";
    }
  }

  // Accepter les URLs valides
  try {
    // URLs absolues
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      new URL(trimmed);
      return trimmed;
    }
    // Chemins relatifs
    if (trimmed.startsWith("/") || trimmed.startsWith("./")) {
      return trimmed;
    }
    // URLs sans protocole (on ajoute https)
    if (!trimmed.includes(":")) {
      return trimmed;
    }
  } catch {
    return "";
  }

  return "";
}

/**
 * Sanitize un numéro de téléphone
 * Garde uniquement les chiffres, +, espaces et tirets
 */
export function sanitizePhone(phone: string | undefined | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d+\s-]/g, "").trim();
}

/**
 * Sanitize un email (lowercase et trim)
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

/**
 * Sanitize un objet en appliquant les fonctions de sanitization appropriées
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizers: Partial<Record<keyof T, (value: unknown) => unknown>>
): T {
  const result = { ...obj };

  for (const [key, sanitizer] of Object.entries(sanitizers)) {
    if (key in result && sanitizer) {
      result[key as keyof T] = sanitizer(result[key as keyof T]) as T[keyof T];
    }
  }

  return result;
}

/**
 * Valide et sanitize un ID YouTube
 */
export function sanitizeYoutubeUrl(url: string | undefined | null): string {
  if (!url) return "";

  const trimmed = url.trim();

  // Patterns YouTube valides
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Si c'est juste un ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}`;
  }

  return "";
}

/**
 * Sanitize un tableau de chaînes
 */
export function sanitizeStringArray(
  arr: unknown,
  sanitizer: (s: string) => string = sanitizeText
): string[] {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter((item): item is string => typeof item === "string")
    .map(sanitizer)
    .filter(Boolean);
}
