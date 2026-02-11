CREATE TABLE "contact_share_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisateur_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"label" varchar(255),
	"expires_at" timestamp NOT NULL,
	"max_uses" integer DEFAULT 10,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_share_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "source_type" varchar(30);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "source_label" varchar(255);--> statement-breakpoint
ALTER TABLE "contact_share_tokens" ADD CONSTRAINT "contact_share_tokens_organisateur_id_organisateurs_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."organisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_organisateur_email_idx" ON "contacts" USING btree ("organisateur_id","email");