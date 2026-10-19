CREATE TABLE "seed_run" (
	"name" text PRIMARY KEY NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN "product_id" integer;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;