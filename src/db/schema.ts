import {
  pgTable, pgEnum, serial, integer, text, timestamp, boolean, jsonb, uniqueIndex, index,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "user"]);
export const accountRole = pgEnum("account_role", ["account_admin", "member"]);
export const resourceType = pgEnum("resource_type", ["blog", "document", "insight"]);
export const publishStatus = pgEnum("publish_status", ["draft", "published"]);
export const docStatus = pgEnum("doc_status", ["latest", "supported", "deprecated", "draft"]);
export const caseStatus = pgEnum("case_status", ["new", "in_progress", "awaiting_customer", "resolved", "closed"]);
export const caseEnv = pgEnum("case_env", ["production", "sub_production"]);
export const requestType = pgEnum("request_type", ["demo", "information", "newsletter", "license"]);
export const requestStatus = pgEnum("request_status", ["new", "contacted", "closed"]);
export const licenseStatus = pgEnum("license_status", ["active", "trial", "expired", "cancelled"]);
export const inviteStatus = pgEnum("invite_status", ["pending", "accepted", "revoked"]);

/** Company account. Many users belong to one account. */
export const accounts = pgTable("account", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("account_domain_idx").on(t.domain)]);

/** Individual person, identified by email. */
export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  image: text("image"),
  role: userRole("role").default("user").notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  accountRole: accountRole("account_role"),
  provider: text("provider"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("user_email_idx").on(t.email), index("user_account_idx").on(t.accountId)]);

/** Invitation for an email address to join an account. */
export const invites = pgTable("invite", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  accountRole: accountRole("account_role").default("member").notNull(),
  invitedById: integer("invited_by_id").references(() => users.id, { onDelete: "set null" }),
  status: inviteStatus("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
}, (t) => [uniqueIndex("invite_token_idx").on(t.token), index("invite_email_idx").on(t.email)]);

/** Product for sale (apps and plans). */
/** Copy for a product or agent detail page: the problem, the approach, and the capabilities. */
export type CatalogPage = {
  headline: string;
  accent: string;
  lede: string;
  reads?: string[];
  produces?: string[];
  problem: { title: string; body: string; quote?: string; points: { title: string; body: string }[] };
  approach: { title: string; body: string; before?: string[]; after?: string[]; steps?: { title: string; body: string }[]; outcomes: string[] };
  capabilitiesTitle: string;
  capabilities: { title: string; body: string; agent?: string }[];
  requirements?: [string, string][];
};

export const products = pgTable("product", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  kind: text("kind").notNull(), // "app" | "store_app"
  tagline: text("tagline"),
  description: text("description"),
  plan: text("plan"), // Team | Pro | Max
  priceAnnual: integer("price_annual"), // USD per year per instance
  userLimit: integer("user_limit"), // null = unlimited
  features: jsonb("features").$type<string[]>().default([]).notNull(),
  hasDocs: boolean("has_docs").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  page: jsonb("page").$type<CatalogPage>(),
}, (t) => [uniqueIndex("product_slug_idx").on(t.slug)]);

/** AI agent for sale, included with a product plan. */
export const agents = pgTable("agent", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  appName: text("app_name").notNull(),
  tier: text("tier"), // Team | Pro | Max
  description: text("description").notNull(),
  live: boolean("live").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  page: jsonb("page").$type<CatalogPage>(),
}, (t) => [uniqueIndex("agent_slug_idx").on(t.slug)]);

/** Blog posts, documents, insights and other resources. */
export const resources = pgTable("resource", {
  id: serial("id").primaryKey(),
  type: resourceType("type").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  body: text("body"), // markdown
  category: text("category"),
  authorName: text("author_name"),
  authorTitle: text("author_title"),
  heroImage: text("hero_image"),
  /** Product promoted in the article's call to action and sidebar. */
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  status: publishStatus("status").default("draft").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("resource_slug_idx").on(t.slug)]);

/** Versioned product documentation pages. */
export const documentation = pgTable("documentation", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  version: text("version").notNull(),
  versionStatus: docStatus("version_status").default("supported").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  section: text("section").default("Install and configure").notNull(),
  summary: text("summary"),
  body: text("body").notNull(), // markdown
  sortOrder: integer("sort_order").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("doc_unique_idx").on(t.productId, t.version, t.slug)]);

/** Customer support case. */
export const cases = pgTable("case", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  version: text("version"),
  instance: text("instance"),
  environment: caseEnv("environment").default("production").notNull(),
  severity: integer("severity").default(3).notNull(),
  status: caseStatus("status").default("new").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  openedById: integer("opened_by_id").references(() => users.id, { onDelete: "set null" }),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("case_number_idx").on(t.number), index("case_account_idx").on(t.accountId)]);

/** Messages on a support case. */
export const caseComments = pgTable("case_comment", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  fromSupport: boolean("from_support").default(false).notNull(),
  internal: boolean("internal").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("comment_case_idx").on(t.caseId)]);

/** Request for information: demo, information, newsletter, license change. */
export const requests = pgTable("request", {
  id: serial("id").primaryKey(),
  type: requestType("type").notNull(),
  name: text("name"),
  email: text("email").notNull(),
  company: text("company"),
  role: text("role"),
  message: text("message"),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  status: requestStatus("status").default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** License for an account to use a product. */
export const licenses = pgTable("license", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
  plan: text("plan"),
  seats: integer("seats"), // null = unlimited
  instance: text("instance"),
  version: text("version"),
  status: licenseStatus("status").default("active").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("license_account_idx").on(t.accountId)]);

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Doc = typeof documentation.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type License = typeof licenses.$inferSelect;

/** One-time data steps the seed has already applied, so they never re-run over admin edits. */
export const seedRuns = pgTable("seed_run", {
  name: text("name").primaryKey(),
  ranAt: timestamp("ran_at", { withTimezone: true }).defaultNow().notNull(),
});
