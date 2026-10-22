CREATE TABLE "account_logo" (
	"account_id" integer PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"data" "bytea" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "company_size" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "billing_email" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "logo_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account_logo" ADD CONSTRAINT "account_logo_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;