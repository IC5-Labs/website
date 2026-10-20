import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** Every product and agent with its active flag, for fitting static markup to the catalog. */
export async function catalogState() {
  const [products, agents] = await Promise.all([
    db.select({ slug: s.products.slug, name: s.products.name, active: s.products.active }).from(s.products),
    db.select({ slug: s.agents.slug, name: s.agents.name, active: s.agents.active }).from(s.agents),
  ]);
  return { products, agents };
}

/** Active products in display order: Store apps first, then plan apps by sort order. */
export async function activeProducts() {
  const rows = await db.select().from(s.products).where(eq(s.products.active, true)).orderBy(asc(s.products.sortOrder));
  return [...rows.filter((p) => p.kind === "store_app"), ...rows.filter((p) => p.kind !== "store_app")];
}

/** Active products that have a page to link to. A Store app's page is its agent's page. */
export async function linkableProducts() {
  const [products, agents] = await Promise.all([
    activeProducts(),
    db.select({ slug: s.agents.slug, page: s.agents.page }).from(s.agents).where(eq(s.agents.active, true)),
  ]);
  const agentPages = new Set(agents.filter((a) => a.page).map((a) => a.slug));
  return products.filter((p) => (p.kind === "store_app" ? agentPages.has(p.slug) : !!p.page));
}

export const productHref = (p: { slug: string; kind: string }) => (p.kind === "store_app" ? `/agents/${p.slug}` : `/products/${p.slug}`);
