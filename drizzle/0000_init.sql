CREATE TYPE "public"."account_role" AS ENUM('account_admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."case_env" AS ENUM('production', 'sub_production');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('new', 'in_progress', 'awaiting_customer', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('latest', 'supported', 'deprecated', 'draft');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."license_status" AS ENUM('active', 'trial', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('demo', 'information', 'newsletter', 'license');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('blog', 'document', 'insight');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"product_id" integer,
	"app_name" text NOT NULL,
	"tier" text,
	"description" text NOT NULL,
	"live" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"author_id" integer,
	"body" text NOT NULL,
	"from_support" boolean DEFAULT false NOT NULL,
	"internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"account_id" integer NOT NULL,
	"product_id" integer,
	"version" text,
	"instance" text,
	"environment" "case_env" DEFAULT 'production' NOT NULL,
	"severity" integer DEFAULT 3 NOT NULL,
	"status" "case_status" DEFAULT 'new' NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"opened_by_id" integer,
	"assigned_to_id" integer,
	"first_response_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentation" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"version" text NOT NULL,
	"version_status" "doc_status" DEFAULT 'supported' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"section" text DEFAULT 'Install and configure' NOT NULL,
	"summary" text,
	"body" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"account_id" integer NOT NULL,
	"email" text NOT NULL,
	"account_role" "account_role" DEFAULT 'member' NOT NULL,
	"invited_by_id" integer,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "license" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"plan" text,
	"seats" integer,
	"instance" text,
	"version" text,
	"status" "license_status" DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"kind" text NOT NULL,
	"tagline" text,
	"description" text,
	"plan" text,
	"price_annual" integer,
	"user_limit" integer,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"has_docs" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "request_type" NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"company" text,
	"role" text,
	"message" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"account_id" integer,
	"user_id" integer,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "resource_type" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text,
	"category" text,
	"author_name" text,
	"author_title" text,
	"hero_image" text,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"account_id" integer,
	"account_role" "account_role",
	"provider" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comment" ADD CONSTRAINT "case_comment_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comment" ADD CONSTRAINT "case_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_opened_by_id_user_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentation" ADD CONSTRAINT "documentation_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license" ADD CONSTRAINT "license_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license" ADD CONSTRAINT "license_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_domain_idx" ON "account" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_slug_idx" ON "agent" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "comment_case_idx" ON "case_comment" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_number_idx" ON "case" USING btree ("number");--> statement-breakpoint
CREATE INDEX "case_account_idx" ON "case" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doc_unique_idx" ON "documentation" USING btree ("product_id","version","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_token_idx" ON "invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invite_email_idx" ON "invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "license_account_idx" ON "license" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_idx" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_slug_idx" ON "resource" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_account_idx" ON "user" USING btree ("account_id");