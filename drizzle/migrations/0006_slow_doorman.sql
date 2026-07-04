CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "avis_groupe_idx" ON "avis" USING btree ("groupe_id");--> statement-breakpoint
CREATE INDEX "concerts_organisateur_idx" ON "concerts" USING btree ("organisateur_id");--> statement-breakpoint
CREATE INDEX "concerts_groupe_idx" ON "concerts" USING btree ("groupe_id");--> statement-breakpoint
CREATE INDEX "concerts_date_idx" ON "concerts" USING btree ("date");--> statement-breakpoint
CREATE INDEX "groupes_nom_trgm_idx" ON "groupes" USING gin ("nom" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "groupes_ville_trgm_idx" ON "groupes" USING gin ("ville" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "groupes_departement_trgm_idx" ON "groupes" USING gin ("departement" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "groupes_region_trgm_idx" ON "groupes" USING gin ("region" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "inscriptions_concert_idx" ON "inscriptions" USING btree ("concert_id");