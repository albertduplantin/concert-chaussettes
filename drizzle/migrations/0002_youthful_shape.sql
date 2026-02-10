ALTER TABLE "inscriptions" ADD COLUMN "prenom" varchar(255);--> statement-breakpoint
ALTER TABLE "inscriptions" ADD COLUMN "management_token" varchar(64);--> statement-breakpoint
ALTER TABLE "inscriptions" ADD COLUMN "show_in_guest_list" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "inscriptions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organisateurs" ADD COLUMN "thumbnail_url" varchar(500);