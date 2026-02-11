CREATE TABLE "avis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupe_id" uuid NOT NULL,
	"concert_id" uuid,
	"auteur_type" varchar(20) NOT NULL,
	"auteur_email" varchar(255) NOT NULL,
	"auteur_nom" varchar(255),
	"note" integer NOT NULL,
	"commentaire" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inscriptions" ADD COLUMN "review_token" varchar(64);--> statement-breakpoint
ALTER TABLE "inscriptions" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_concert_id_concerts_id_fk" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "avis_concert_auteur_idx" ON "avis" USING btree ("concert_id","auteur_email");--> statement-breakpoint
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_review_token_unique" UNIQUE("review_token");