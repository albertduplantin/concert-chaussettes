import { z } from "zod/v4";
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeYoutubeUrl,
} from "./sanitize";

/**
 * Transformateurs Zod avec sanitization intégrée
 */

// Email validé et sanitizé
export const emailSchema = z
  .string()
  .min(1, "L'email est requis")
  .email("Email invalide")
  .max(255, "Email trop long")
  .transform(sanitizeEmail);

// Mot de passe avec règles de sécurité
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Mot de passe trop long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
  );

// Texte sanitizé basique
export const safeTextSchema = z
  .string()
  .transform(sanitizeText);

// Texte sanitizé avec longueur minimale
export const requiredTextSchema = (
  fieldName: string,
  minLength = 1,
  maxLength = 500
) =>
  z
    .string()
    .min(minLength, `${fieldName} est requis`)
    .max(maxLength, `${fieldName} est trop long (max ${maxLength} caractères)`)
    .transform(sanitizeText);

// Téléphone sanitizé
export const phoneSchema = z
  .string()
  .transform(sanitizePhone)
  .refine(
    (val) => !val || /^[+\d][\d\s-]{6,20}$/.test(val),
    "Numéro de téléphone invalide"
  );

// URL sanitizée
export const urlSchema = z
  .string()
  .transform(sanitizeUrl)
  .refine(
    (val) => !val || val.startsWith("http") || val.startsWith("/"),
    "URL invalide"
  );

// URL YouTube sanitizée
export const youtubeUrlSchema = z
  .string()
  .transform(sanitizeYoutubeUrl)
  .refine((val) => !val || val.includes("youtube.com/embed/"), "URL YouTube invalide");

// URL de photo (UploadThing ou URL externe)
export const photoUrlSchema = z
  .string()
  .url("URL de photo invalide")
  .refine(
    (val) =>
      val.startsWith("https://") ||
      val.startsWith("http://localhost"),
    "URL de photo non sécurisée"
  );

// UUID validé
export const uuidSchema = z.string().uuid("ID invalide");

// Code postal français
export const codePostalSchema = z
  .union([
    z.string().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((val) => (val === "" ? null : val));

// Bio avec limite de caractères
export const bioSchema = z
  .string()
  .max(2000, "La bio est trop longue (max 2000 caractères)")
  .transform(sanitizeText)
  .optional();

/**
 * Schémas complets pour les différentes entités
 */

// Schéma d'inscription utilisateur renforcé
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["GROUPE", "ORGANISATEUR"], {
    message: "Rôle invalide",
  }),
  nom: requiredTextSchema("Le nom", 1, 100),
});

// Schéma de connexion
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Helper pour les champs texte optionnels qui peuvent être null
const optionalTextSchema = safeTextSchema.optional().nullable().transform((val) => val || null);

// Schéma de profil groupe renforcé
export const groupeProfileSchema = z.object({
  nom: requiredTextSchema("Le nom du groupe", 1, 100),
  bio: bioSchema.nullable(),
  ville: optionalTextSchema,
  codePostal: codePostalSchema,
  departement: optionalTextSchema,
  region: optionalTextSchema,
  contactEmail: z.union([emailSchema, z.literal(""), z.null()]).optional().nullable().transform((val) => val || null),
  contactTel: z.union([phoneSchema, z.literal(""), z.null()]).optional().nullable().transform((val) => val || null),
  contactSite: z.union([urlSchema, z.literal(""), z.null()]).optional().nullable().transform((val) => val || null),
  genres: z.array(uuidSchema).max(10, "Maximum 10 genres").default([]),
  photos: z
    .array(photoUrlSchema)
    .max(10, "Maximum 10 photos")
    .default([]),
  thumbnailUrl: z
    .union([photoUrlSchema, z.literal(""), z.null()])
    .optional()
    .nullable()
    .transform((val) => val || null),
  youtubeVideos: z
    .array(z.string())
    .max(5, "Maximum 5 vidéos")
    .default([])
    .transform((arr) => arr.filter(Boolean)),
});

// Schéma de profil organisateur
export const organisateurProfileSchema = z.object({
  nom: requiredTextSchema("Le nom", 1, 100),
  bio: bioSchema.nullable(),
  thumbnailUrl: z
    .union([photoUrlSchema, z.literal(""), z.null()])
    .optional()
    .nullable()
    .transform((val) => val || null),
  ville: optionalTextSchema,
  codePostal: codePostalSchema,
  departement: optionalTextSchema,
  region: optionalTextSchema,
});

// Schéma de concert renforcé
export const concertSchema = z.object({
  titre: requiredTextSchema("Le titre", 1, 200),
  description: z
    .string()
    .max(5000, "Description trop longue")
    .transform(sanitizeText)
    .optional(),
  date: z
    .string()
    .min(1, "La date est requise")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, "La date doit être dans le futur"),
  adresseComplete: safeTextSchema.optional(),
  adressePublique: safeTextSchema.optional(),
  ville: safeTextSchema.optional(),
  groupeId: z.union([uuidSchema, z.literal(""), z.null()]).optional(),
  showGroupe: z.boolean().default(true),
  maxInvites: z
    .number()
    .int("Nombre entier requis")
    .min(1, "Minimum 1 invité")
    .max(500, "Maximum 500 invités")
    .nullable()
    .optional(),
  status: z.enum(["BROUILLON", "PUBLIE"]).default("BROUILLON"),
});

// Schema d'inscription a un concert renforce
export const inscriptionSchema = z.object({
  concertId: uuidSchema,
  prenom: requiredTextSchema("Le prenom", 1, 50),
  nom: requiredTextSchema("Le nom", 1, 100),
  email: emailSchema,
  telephone: phoneSchema.optional(),
  nombrePersonnes: z
    .number()
    .int("Nombre entier requis")
    .min(1, "Minimum 1 personne")
    .max(10, "Maximum 10 personnes"),
});

// Schema pour modifier une inscription
export const updateInscriptionSchema = z.object({
  prenom: requiredTextSchema("Le prenom", 1, 50).optional(),
  nom: requiredTextSchema("Le nom", 1, 100).optional(),
  telephone: phoneSchema.optional(),
  nombrePersonnes: z
    .number()
    .int("Nombre entier requis")
    .min(1, "Minimum 1 personne")
    .max(10, "Maximum 10 personnes")
    .optional(),
  showInGuestList: z.boolean().optional(),
});

// Schéma de template de message renforcé
export const messageTemplateSchema = z.object({
  nom: requiredTextSchema("Le nom du template", 1, 100),
  sujet: z
    .string()
    .max(200, "Sujet trop long")
    .transform(sanitizeText)
    .nullable()
    .optional(),
  contenu: z
    .string()
    .min(1, "Le contenu est requis")
    .max(5000, "Contenu trop long")
    .transform(sanitizeText),
  type: z.enum(["EMAIL", "SMS", "WHATSAPP"], {
    message: "Type de message invalide",
  }),
});

/**
 * Helper pour valider et retourner les erreurs formatées
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: result.error.issues[0]?.message || "Données invalides",
    details: result.error,
  };
}
