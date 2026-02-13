CREATE TABLE "demandes_devis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupe_id" uuid NOT NULL,
	"nom" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"telephone" varchar(20),
	"date_souhaitee" timestamp NOT NULL,
	"nombre_invites" varchar(20),
	"lieu" varchar(255) NOT NULL,
	"type_evenement" varchar(50),
	"message" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demandes_devis" ADD CONSTRAINT "demandes_devis_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE cascade ON UPDATE no action;