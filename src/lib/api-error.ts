import { NextResponse } from "next/server";

/**
 * Types d'erreurs API standardisés
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Classe d'erreur API personnalisée
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new ApiError(message, ApiErrorCode.VALIDATION_ERROR, 400, details);
  }

  static unauthorized(message = "Non autorisé") {
    return new ApiError(message, ApiErrorCode.UNAUTHORIZED, 401);
  }

  static forbidden(message = "Accès interdit") {
    return new ApiError(message, ApiErrorCode.FORBIDDEN, 403);
  }

  static notFound(message = "Ressource non trouvée") {
    return new ApiError(message, ApiErrorCode.NOT_FOUND, 404);
  }

  static conflict(message: string) {
    return new ApiError(message, ApiErrorCode.CONFLICT, 409);
  }

  static rateLimited(message = "Trop de requêtes, veuillez réessayer plus tard") {
    return new ApiError(message, ApiErrorCode.RATE_LIMITED, 429);
  }

  static internal(message = "Erreur interne du serveur") {
    return new ApiError(message, ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * Réponse d'erreur API standardisée
 */
interface ErrorResponse {
  error: {
    message: string;
    code: ApiErrorCode;
    details?: Record<string, unknown>;
  };
}

/**
 * Convertit une ApiError en NextResponse
 */
export function apiErrorResponse(error: ApiError): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
    },
    { status: error.statusCode }
  );
}

/**
 * Handler centralisé pour les erreurs dans les routes API
 * Utilisation: return handleApiError(error, "Contexte de l'opération");
 */
export function handleApiError(
  error: unknown,
  context: string
): NextResponse<ErrorResponse> {
  // Si c'est déjà une ApiError, on la renvoie
  if (error instanceof ApiError) {
    return apiErrorResponse(error);
  }

  // Log l'erreur pour le debugging (en prod, utiliser un service de logging)
  console.error(`[API Error] ${context}:`, error);

  // Erreur générique pour éviter de fuiter des infos sensibles
  return apiErrorResponse(ApiError.internal());
}

/**
 * Wrapper pour les routes API avec gestion d'erreur automatique
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context: string
): Promise<NextResponse<T | ErrorResponse>> {
  return handler().catch((error) => handleApiError(error, context));
}
