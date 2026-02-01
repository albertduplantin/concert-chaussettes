import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export type AuditAction =
  | "login"
  | "logout"
  | "register"
  | "oauth_login"
  | "oauth_register"
  | "password_reset"
  | "profile_update"
  | "account_delete";

interface AuditLogParams {
  userId?: string | null;
  action: AuditAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Enregistre un événement d'audit
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId || null,
      action: params.action,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    // Ne pas bloquer l'opération principale si l'audit échoue
    console.error("Erreur lors de l'enregistrement de l'audit:", error);
  }
}

/**
 * Extrait l'IP d'une requête
 */
export function getClientIp(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}

/**
 * Extrait le User-Agent d'une requête
 */
export function getUserAgent(headers: Headers): string | null {
  return headers.get("user-agent") || null;
}
