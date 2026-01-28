import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  jsonb,
  pgEnum,
  real,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ ENUMS ============

export const userRoleEnum = pgEnum("user_role", [
  "GROUPE",
  "ORGANISATEUR",
  "ADMIN",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "FREE",
  "PREMIUM",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "CANCELLED",
  "PAST_DUE",
]);

export const concertStatusEnum = pgEnum("concert_status", [
  "BROUILLON",
  "PUBLIE",
  "PASSE",
  "ANNULE",
]);

export const inscriptionStatusEnum = pgEnum("inscription_status", [
  "CONFIRME",
  "LISTE_ATTENTE",
  "ANNULE",
]);

export const messageTypeEnum = pgEnum("message_type", [
  "EMAIL",
  "SMS",
  "WHATSAPP",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "PENDING",
  "REVIEWED",
  "DISMISSED",
]);

export const analyticsTypeEnum = pgEnum("analytics_type", [
  "PROFILE_VIEW",
  "CONCERT_VIEW",
  "INSCRIPTION",
]);

// ============ TABLES ============

// --- User ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("GROUPE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Subscription ---
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  plan: subscriptionPlanEnum("plan").notNull().default("FREE"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  currentPeriodEnd: timestamp("current_period_end"),
  features: jsonb("features").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Genre ---
export const genres = pgTable("genres", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull().unique(),
  isCustom: boolean("is_custom").notNull().default(false),
});

// --- Groupe ---
export const groupes = pgTable("groupes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  nom: varchar("nom", { length: 255 }).notNull(),
  bio: text("bio"),
  photos: jsonb("photos").$type<string[]>().default([]),
  youtubeVideos: jsonb("youtube_videos").$type<string[]>().default([]),
  // Localisation
  ville: varchar("ville", { length: 255 }),
  codePostal: varchar("code_postal", { length: 10 }),
  departement: varchar("departement", { length: 100 }),
  region: varchar("region", { length: 100 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  // Contact
  contactEmail: varchar("contact_email", { length: 255 }),
  contactTel: varchar("contact_tel", { length: 20 }),
  contactSite: varchar("contact_site", { length: 500 }),
  // Premium features
  isVerified: boolean("is_verified").notNull().default(false),
  isBoosted: boolean("is_boosted").notNull().default(false),
  boostExpiresAt: timestamp("boost_expires_at"),
  // Status
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- GroupeGenre (many-to-many) ---
export const groupeGenres = pgTable(
  "groupe_genres",
  {
    groupeId: uuid("groupe_id")
      .notNull()
      .references(() => groupes.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.groupeId, t.genreId] })]
);

// --- Organisateur ---
export const organisateurs = pgTable("organisateurs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  nom: varchar("nom", { length: 255 }).notNull(),
  bio: text("bio"),
  // Localisation
  ville: varchar("ville", { length: 255 }),
  codePostal: varchar("code_postal", { length: 10 }),
  departement: varchar("departement", { length: 100 }),
  region: varchar("region", { length: 100 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  // Premium
  customBranding: jsonb("custom_branding").$type<{
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Concert ---
export const concerts = pgTable("concerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisateurId: uuid("organisateur_id")
    .notNull()
    .references(() => organisateurs.id, { onDelete: "cascade" }),
  groupeId: uuid("groupe_id").references(() => groupes.id, {
    onDelete: "set null",
  }),
  titre: varchar("titre", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  // Adresse
  adresseComplete: text("adresse_complete"),
  adressePublique: varchar("adresse_publique", { length: 255 }),
  ville: varchar("ville", { length: 255 }),
  // Config
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  showGroupe: boolean("show_groupe").notNull().default(true),
  maxInvites: integer("max_invites"),
  customBranding: jsonb("custom_branding").$type<{
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>(),
  status: concertStatusEnum("status").notNull().default("BROUILLON"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Inscription ---
export const inscriptions = pgTable("inscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  concertId: uuid("concert_id")
    .notNull()
    .references(() => concerts.id, { onDelete: "cascade" }),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  telephone: varchar("telephone", { length: 20 }),
  nombrePersonnes: integer("nombre_personnes").notNull().default(1),
  status: inscriptionStatusEnum("status").notNull().default("CONFIRME"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Contact (CRM organisateur) ---
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisateurId: uuid("organisateur_id")
    .notNull()
    .references(() => organisateurs.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  nom: varchar("nom", { length: 255 }),
  telephone: varchar("telephone", { length: 20 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  nombreParticipations: integer("nombre_participations").notNull().default(0),
  dernierConcertId: uuid("dernier_concert_id").references(() => concerts.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- MessageTemplate ---
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisateurId: uuid("organisateur_id").references(() => organisateurs.id, {
    onDelete: "cascade",
  }),
  nom: varchar("nom", { length: 255 }).notNull(),
  sujet: varchar("sujet", { length: 500 }),
  contenu: text("contenu").notNull(),
  type: messageTypeEnum("type").notNull().default("EMAIL"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Analytics ---
export const analytics = pgTable("analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: analyticsTypeEnum("type").notNull(),
  targetId: uuid("target_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Report (signalements) ---
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: varchar("target_type", { length: 50 }).notNull(), // 'groupe' | 'concert'
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  groupe: one(groupes, {
    fields: [users.id],
    references: [groupes.userId],
  }),
  organisateur: one(organisateurs, {
    fields: [users.id],
    references: [organisateurs.userId],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const groupesRelations = relations(groupes, ({ one, many }) => ({
  user: one(users, {
    fields: [groupes.userId],
    references: [users.id],
  }),
  groupeGenres: many(groupeGenres),
  concerts: many(concerts),
}));

export const groupeGenresRelations = relations(groupeGenres, ({ one }) => ({
  groupe: one(groupes, {
    fields: [groupeGenres.groupeId],
    references: [groupes.id],
  }),
  genre: one(genres, {
    fields: [groupeGenres.genreId],
    references: [genres.id],
  }),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  groupeGenres: many(groupeGenres),
}));

export const organisateursRelations = relations(
  organisateurs,
  ({ one, many }) => ({
    user: one(users, {
      fields: [organisateurs.userId],
      references: [users.id],
    }),
    concerts: many(concerts),
    contacts: many(contacts),
    messageTemplates: many(messageTemplates),
  })
);

export const concertsRelations = relations(concerts, ({ one, many }) => ({
  organisateur: one(organisateurs, {
    fields: [concerts.organisateurId],
    references: [organisateurs.id],
  }),
  groupe: one(groupes, {
    fields: [concerts.groupeId],
    references: [groupes.id],
  }),
  inscriptions: many(inscriptions),
}));

export const inscriptionsRelations = relations(inscriptions, ({ one }) => ({
  concert: one(concerts, {
    fields: [inscriptions.concertId],
    references: [concerts.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  organisateur: one(organisateurs, {
    fields: [contacts.organisateurId],
    references: [organisateurs.id],
  }),
  dernierConcert: one(concerts, {
    fields: [contacts.dernierConcertId],
    references: [concerts.id],
  }),
}));

export const messageTemplatesRelations = relations(
  messageTemplates,
  ({ one }) => ({
    organisateur: one(organisateurs, {
      fields: [messageTemplates.organisateurId],
      references: [organisateurs.id],
    }),
  })
);

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
}));
