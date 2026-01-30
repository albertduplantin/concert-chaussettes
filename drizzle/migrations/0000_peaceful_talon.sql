CREATE TYPE "public"."analytics_type" AS ENUM('PROFILE_VIEW', 'CONCERT_VIEW', 'INSCRIPTION');--> statement-breakpoint
CREATE TYPE "public"."concert_status" AS ENUM('BROUILLON', 'PUBLIE', 'PASSE', 'ANNULE');--> statement-breakpoint
CREATE TYPE "public"."inscription_status" AS ENUM('CONFIRME', 'LISTE_ATTENTE', 'ANNULE');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('EMAIL', 'SMS', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('PENDING', 'REVIEWED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('FREE', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'CANCELLED', 'PAST_DUE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('GROUPE', 'ORGANISATEUR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "analytics_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisateur_id" uuid NOT NULL,
	"groupe_id" uuid,
	"titre" varchar(255) NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"adresse_complete" text,
	"adresse_publique" varchar(255),
	"ville" varchar(255),
	"slug" varchar(255) NOT NULL,
	"show_groupe" boolean DEFAULT true NOT NULL,
	"max_invites" integer,
	"custom_branding" jsonb,
	"status" "concert_status" DEFAULT 'BROUILLON' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "concerts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisateur_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"nom" varchar(255),
	"telephone" varchar(20),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"nombre_participations" integer DEFAULT 0 NOT NULL,
	"dernier_concert_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(100) NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	CONSTRAINT "genres_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "groupe_genres" (
	"groupe_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "groupe_genres_groupe_id_genre_id_pk" PRIMARY KEY("groupe_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "groupes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nom" varchar(255) NOT NULL,
	"bio" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"thumbnail_url" varchar(500),
	"youtube_videos" jsonb DEFAULT '[]'::jsonb,
	"ville" varchar(255),
	"code_postal" varchar(10),
	"departement" varchar(100),
	"region" varchar(100),
	"latitude" real,
	"longitude" real,
	"contact_email" varchar(255),
	"contact_tel" varchar(20),
	"contact_site" varchar(500),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_boosted" boolean DEFAULT false NOT NULL,
	"boost_expires_at" timestamp,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groupes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "inscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concert_id" uuid NOT NULL,
	"nom" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"telephone" varchar(20),
	"nombre_personnes" integer DEFAULT 1 NOT NULL,
	"status" "inscription_status" DEFAULT 'CONFIRME' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisateur_id" uuid,
	"nom" varchar(255) NOT NULL,
	"sujet" varchar(500),
	"contenu" text NOT NULL,
	"type" "message_type" DEFAULT 'EMAIL' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisateurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nom" varchar(255) NOT NULL,
	"bio" text,
	"ville" varchar(255),
	"code_postal" varchar(10),
	"departement" varchar(100),
	"region" varchar(100),
	"latitude" real,
	"longitude" real,
	"custom_branding" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisateurs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" DEFAULT 'FREE' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"current_period_end" timestamp,
	"features" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"password_hash" text,
	"name" varchar(255),
	"image" varchar(500),
	"role" "user_role" DEFAULT 'ORGANISATEUR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_organisateur_id_organisateurs_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."organisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organisateur_id_organisateurs_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."organisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_dernier_concert_id_concerts_id_fk" FOREIGN KEY ("dernier_concert_id") REFERENCES "public"."concerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupe_genres" ADD CONSTRAINT "groupe_genres_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupe_genres" ADD CONSTRAINT "groupe_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupes" ADD CONSTRAINT "groupes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_concert_id_concerts_id_fk" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organisateur_id_organisateurs_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."organisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisateurs" ADD CONSTRAINT "organisateurs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;