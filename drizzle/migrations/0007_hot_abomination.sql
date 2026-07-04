CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."avis_cible" AS ENUM('GROUPE', 'ORGANISATEUR');--> statement-breakpoint
CREATE TABLE "demandes_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupe_id" uuid NOT NULL,
	"organisateur_id" uuid NOT NULL,
	"message" text NOT NULL,
	"date_souhaitee" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "avis" ADD COLUMN "cible" "avis_cible" DEFAULT 'GROUPE' NOT NULL;--> statement-breakpoint
ALTER TABLE "avis" ADD COLUMN "organisateur_id" uuid;--> statement-breakpoint
ALTER TABLE "avis" ADD COLUMN "media_urls" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "avis" ADD COLUMN "reveal_at" timestamp;--> statement-breakpoint
ALTER TABLE "organisateurs" ADD COLUMN "photos" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "organisateurs" ADD COLUMN "capacite_max" integer;--> statement-breakpoint
ALTER TABLE "organisateurs" ADD COLUMN "equipements" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "organisateurs" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "demandes_contact" ADD CONSTRAINT "demandes_contact_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_contact" ADD CONSTRAINT "demandes_contact_organisateur_id_organisateurs_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."organisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demandes_contact_organisateur_idx" ON "demandes_contact" USING btree ("organisateur_id");--> statement-breakpoint
CREATE INDEX "demandes_contact_groupe_idx" ON "demandes_contact" USING btree ("groupe_id");--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_organisateur_id_organisateurs_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."organisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "avis_organisateur_idx" ON "avis" USING btree ("organisateur_id");--> statement-breakpoint
CREATE INDEX "organisateurs_is_visible_idx" ON "organisateurs" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "organisateurs_nom_trgm_idx" ON "organisateurs" USING gin ("nom" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "organisateurs_ville_trgm_idx" ON "organisateurs" USING gin ("ville" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "organisateurs_departement_trgm_idx" ON "organisateurs" USING gin ("departement" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "organisateurs_region_trgm_idx" ON "organisateurs" USING gin ("region" gin_trgm_ops);