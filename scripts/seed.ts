/**
 * Idempotent seed. Creates the platform admin and catalog data only when missing,
 * so edits made through the admin console are never overwritten on restart.
 */
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, isNull } from "drizzle-orm";
import { Pool } from "pg";
import * as s from "../src/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const needsSsl = /sslmode=require/.test(url) || /neon\.tech|replit/.test(url);
const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
const db = drizzle(pool, { schema: s });

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "kit@ic5labs.com").toLowerCase();

async function main() {
  // Platform admin
  const existingAdmin = await db.query.users.findFirst({ where: eq(s.users.email, ADMIN_EMAIL) });
  if (!existingAdmin) {
    await db.insert(s.users).values({ email: ADMIN_EMAIL, name: "Kit Corry", role: "admin" });
  } else if (existingAdmin.role !== "admin") {
    await db.update(s.users).set({ role: "admin" }).where(eq(s.users.id, existingAdmin.id));
  }

  // Products
  const productSeed: (typeof s.products.$inferInsert)[] = [
    {
      slug: "customer-signals", name: "Customer Signals", shortName: "CS", kind: "app", plan: "Team",
      priceAnnual: 10000, userLimit: 9, sortOrder: 1,
      tagline: "Capture the voice of the customer.",
      description: "Turn raw conversations into prioritized customer needs, with the customer’s own words attached as evidence, inside ServiceNow.",
      features: ["Tap into true customer signals", "Prioritize customer needs", "Raw evidence for builders"],
    },
    {
      slug: "product-model", name: "Product Model", shortName: "PM", kind: "app", plan: "Pro",
      priceAnnual: 25000, userLimit: 50, sortOrder: 2,
      tagline: "Know what is being built, and why.",
      description: "Connect customer signals to the complete product definition, from capabilities and features to detailed requirements, with a real-time roadmap of what comes next.",
      features: ["Cross-product strategies", "Real-time roadmaps", "Generated feature specifications"],
    },
    {
      slug: "release-intelligence", name: "Release Intelligence", shortName: "RI", kind: "app", plan: "Max",
      priceAnnual: 50000, userLimit: null, sortOrder: 3,
      tagline: "Release with evidence, not guesswork.",
      description: "Phase-gate every release, connect it to the customer needs it addresses, and close the loop with the people who asked for the work in the first place.",
      features: ["Phase-gate release process", "Releases tied to customer outcomes", "Close the loop with customers"],
    },
    {
      slug: "customer-signals-agent", name: "Customer Signals Agent", shortName: "CSA", kind: "store_app", plan: null,
      priceAnnual: null, userLimit: null, sortOrder: 4, hasDocs: true,
      tagline: "AI Agent that turns customer meeting transcripts into organized, evidence-backed customer needs.",
      description: "Reads your customer meeting transcripts and turns them into structured, evidence-backed customer needs, pain points, and personas. Available on the ServiceNow Store.",
      features: ["Transcript analysis", "Evidence creation", "Persona and need suggestion", "Dashboard overview"],
    },
  ];
  for (const p of productSeed) {
    const found = await db.query.products.findFirst({ where: eq(s.products.slug, p.slug!) });
    if (!found) await db.insert(s.products).values(p);
  }
  const prod = Object.fromEntries((await db.select().from(s.products)).map((p) => [p.slug, p]));

  // Agents
  const agentSeed: (typeof s.agents.$inferInsert)[] = [
    { slug: "customer-signals-agent", name: "Customer Signals Agent", appName: "Customer Signals", productId: prod["customer-signals-agent"].id, tier: null, live: true, sortOrder: 1,
      description: "Reads meeting transcripts and proposes candidate needs, pain points, feature opportunities, and personas, with customer quotes attached as evidence." },
    { slug: "signals-discovery-agent", name: "Signals Discovery Agent", appName: "Customer Signals", productId: prod["customer-signals"].id, tier: "Team", sortOrder: 2,
      description: "Finds customer signals across conversations and records, and matches new evidence to the needs that already exist." },
    { slug: "signals-priority-agent", name: "Signals Priority Agent", appName: "Customer Signals", productId: prod["customer-signals"].id, tier: "Team", sortOrder: 3,
      description: "Weighs needs by who is asking and how often, so the prioritization conversation starts from evidence." },
    { slug: "requirements-generation-agent", name: "Requirements Generation Agent", appName: "Product Model", productId: prod["product-model"].id, tier: "Pro", sortOrder: 4,
      description: "Drafts requirements and acceptance criteria from a feature definition, its linked customer needs, and the evidence behind them." },
    { slug: "build-orchestration-agent", name: "Build Orchestration Agent", appName: "Product Model", productId: prod["product-model"].id, tier: "Pro", sortOrder: 5,
      description: "Takes approved requirements and supervises the build using ServiceNow Build Agent." },
    { slug: "release-notes-agent", name: "Release Notes Agent", appName: "Release Intelligence", productId: prod["release-intelligence"].id, tier: "Max", sortOrder: 6,
      description: "Writes evidence-backed release notes, identifies impacted users, and summarizes customer value." },
    { slug: "release-manager-agent", name: "Release Manager Agent", appName: "Release Intelligence", productId: prod["release-intelligence"].id, tier: "Max", sortOrder: 7,
      description: "Tracks phase gates and release state, and flags a release in jeopardy before it slips." },
  ];
  for (const a of agentSeed) {
    const found = await db.query.agents.findFirst({ where: eq(s.agents.slug, a.slug!) });
    if (!found) await db.insert(s.agents).values(a);
  }

  // Detail page copy for products and agents. Bump the version when content/catalog changes
  // so the new copy is written once; nothing in the admin console edits these fields.
  const catalogPages = "catalog-pages-v1";
  if (!(await db.query.seedRuns.findFirst({ where: eq(s.seedRuns.name, catalogPages) }))) {
    const productPages = JSON.parse(readFileSync("content/catalog/products.json", "utf8")) as Record<string, s.CatalogPage>;
    const agentPages = JSON.parse(readFileSync("content/catalog/agents.json", "utf8")) as Record<string, s.CatalogPage>;
    for (const [slug, page] of Object.entries(productPages)) await db.update(s.products).set({ page }).where(eq(s.products.slug, slug));
    for (const [slug, page] of Object.entries(agentPages)) await db.update(s.agents).set({ page }).where(eq(s.agents.slug, slug));
    await db.insert(s.seedRuns).values({ name: catalogPages }).onConflictDoNothing();
  }

  const admin = await db.query.users.findFirst({ where: eq(s.users.email, ADMIN_EMAIL) });

  // Blog post
  const blogSlug = "new-product-bottleneck";
  if (!(await db.query.resources.findFirst({ where: eq(s.resources.slug, blogSlug) }))) {
    await db.insert(s.resources).values({
      type: "blog", slug: blogSlug, status: "published",
      title: "The New Product Bottleneck: What Happens When One PM Can No Longer Keep Up With What Their Team Can Build",
      summary: "AI has pushed the effective PM-to-engineer ratio from roughly 1:8 to 1:20. Here is what breaks in roadmapping and requirements when the constraint shifts from building to deciding, and how to fix the input side of the problem.",
      category: "Product Management · AI · ServiceNow",
      authorName: "Kit Corry", authorTitle: "CEO, IC5 Labs",
      heroImage: "/assets/blog-new-product-bottleneck.jpg",
      productId: prod["customer-signals-agent"]?.id ?? null,
      body: readFileSync("content/blog/new-product-bottleneck.md", "utf8"),
      publishedAt: new Date("2026-10-15T12:00:00Z"), createdById: admin?.id,
    });
  }

  // Blog posts carried over from the previous ic5labs.com/blog
  const posts = JSON.parse(readFileSync("content/blog/posts.json", "utf8")) as { slug: string; title: string; summary: string; category: string; publishedAt: string; product: string }[];
  for (const p of posts) {
    if (await db.query.resources.findFirst({ where: eq(s.resources.slug, p.slug) })) continue;
    await db.insert(s.resources).values({
      type: "blog", slug: p.slug, status: "published", title: p.title, summary: p.summary, category: p.category,
      authorName: "Kit Corry", authorTitle: "CEO, IC5 Labs",
      heroImage: `/assets/blog-${p.slug}.jpg`,
      productId: prod[p.product]?.id ?? null,
      body: readFileSync(`content/blog/${p.slug}.md`, "utf8"),
      publishedAt: new Date(p.publishedAt), createdById: admin?.id,
    });
  }

  // One-time: link existing blog posts to the product their call to action promotes.
  // Recorded in seed_run so a product an admin later changes or clears is never overwritten.
  const blogProducts = "blog-products-v1";
  if (!(await db.query.seedRuns.findFirst({ where: eq(s.seedRuns.name, blogProducts) }))) {
    const links: Record<string, string> = { [blogSlug]: "customer-signals-agent", ...Object.fromEntries(posts.map((p) => [p.slug, p.product])) };
    for (const [slug, product] of Object.entries(links)) {
      if (!prod[product]) continue;
      await db.update(s.resources).set({ productId: prod[product].id }).where(and(eq(s.resources.slug, slug), isNull(s.resources.productId)));
    }
    await db.insert(s.seedRuns).values({ name: blogProducts }).onConflictDoNothing();
  }

  // State of Product insights
  const insights = JSON.parse(readFileSync("content/insights/state-of-product-2027.json", "utf8")) as { title: string; image: string | null; body: string }[];
  for (const [i, it] of insights.entries()) {
    const slug = "state-of-product-" + it.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (await db.query.resources.findFirst({ where: eq(s.resources.slug, slug) })) continue;
    await db.insert(s.resources).values({
      type: "insight", slug, status: "published", title: it.title,
      summary: it.body.split("\n").find((l) => l.trim()) ?? null,
      body: it.body + "\n\n*Source: Atlassian, State of Product 2027. Methodology: Wakefield Research, 1,000 respondents across the US, Germany and France, surveyed August 2026.*",
      category: "State of Product 2027", heroImage: it.image, authorName: "IC5 Labs",
      publishedAt: new Date(Date.UTC(2026, 9, 1 + i)), createdById: admin?.id,
    });
  }

  // Documentation: Customer Signals Agent installation guide, v1.0 and v1.1
  const csa = prod["customer-signals-agent"];
  const installBody = readFileSync("content/docs/csa-installation.md", "utf8");
  for (const [version, versionStatus] of [["1.1", "latest"], ["1.0", "supported"]] as const) {
    const found = await db.query.documentation.findFirst({
      where: and(eq(s.documentation.productId, csa.id), eq(s.documentation.version, version), eq(s.documentation.slug, "installation")),
    });
    if (!found) {
      await db.insert(s.documentation).values({
        productId: csa.id, version, versionStatus, slug: "installation", title: "Installation and configuration",
        section: "Install and configure", sortOrder: 1, body: installBody,
        summary: "Install Customer Signals Agent from the ServiceNow Store, connect your approved model provider, apply guardrails, and confirm the agent can analyze a transcript.",
      });
    }
  }

  console.log("Seed complete");
}

await main();
await pool.end();
