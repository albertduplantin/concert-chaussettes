/**
 * Simple in-memory rate limiter
 * Pour une solution production, utiliser Redis ou une base de données
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Nombre maximum de requêtes autorisées */
  maxRequests: number;
  /** Fenêtre de temps en millisecondes */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Vérifie si une requête est autorisée selon le rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitMap.get(key);

  // Créer ou réinitialiser l'entrée si expirée
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Réinitialise le rate limit pour un identifiant
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Configurations prédéfinies
 */
export const RATE_LIMITS = {
  /** Login: 5 tentatives par 15 minutes */
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  /** Register: 3 inscriptions par heure */
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  /** API générale: 100 requêtes par minute */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
} as const;
