import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

export async function publishedResources(type?: "blog" | "document" | "insight") {
  const where = type ? and(eq(s.resources.status, "published"), eq(s.resources.type, type)) : eq(s.resources.status, "published");
  return db.select().from(s.resources).where(where).orderBy(desc(s.resources.publishedAt));
}

export async function resourceBySlug(slug: string) {
  return db.query.resources.findFirst({ where: eq(s.resources.slug, slug) });
}

/** Products that have documentation, each with its versions (latest first). */
export async function docsCatalog() {
  const products = await db.select().from(s.products).where(eq(s.products.active, true)).orderBy(asc(s.products.sortOrder));
  const docs = await db.select({
    productId: s.documentation.productId, version: s.documentation.version, versionStatus: s.documentation.versionStatus,
    slug: s.documentation.slug, title: s.documentation.title, section: s.documentation.section, sortOrder: s.documentation.sortOrder,
  }).from(s.documentation);
  return products.map((p) => {
    const pd = docs.filter((d) => d.productId === p.id && d.versionStatus !== "draft");
    const versions = [...new Set(pd.map((d) => d.version))]
      .map((v) => ({ version: v, status: pd.find((d) => d.version === v)!.versionStatus }))
      .sort((a, b) => compareVersions(b.version, a.version));
    return { product: p, versions, pages: pd };
  });
}

export function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** Simple full-text search over documentation (title and body). */
export async function searchDocs(q: string, productSlug?: string, version?: string) {
  const term = q.trim().slice(0, 100);
  if (!term) return [];
  const { ilike, or } = await import("drizzle-orm");
  const rows = await db.select({
    title: s.documentation.title, body: s.documentation.body, version: s.documentation.version, slug: s.documentation.slug,
    status: s.documentation.versionStatus, product: s.products.name, productSlug: s.products.slug,
  }).from(s.documentation).innerJoin(s.products, eq(s.products.id, s.documentation.productId))
    .where(and(eq(s.products.active, true), or(ilike(s.documentation.title, `%${term}%`), ilike(s.documentation.body, `%${term}%`))));
  return rows
    .filter((r) => r.status !== "draft" && (!productSlug || r.productSlug === productSlug) && (!version || r.version === version))
    .map((r) => {
      const i = r.body.toLowerCase().indexOf(term.toLowerCase());
      const raw = i >= 0 ? r.body.slice(Math.max(0, i - 80), i + 160) : r.body.slice(0, 200);
      const snippet = raw.replace(/[#*`>\[\]!()|-]/g, " ").replace(/\s+/g, " ").trim();
      return { title: r.title, product: r.product, version: r.version, href: `/docs/${r.productSlug}/${r.version}/${r.slug}`, snippet: (i > 80 ? "… " : "") + snippet + " …" };
    })
    .sort((a, b) => compareVersions(b.version, a.version));
}

/** Legal documents live at their own short URLs, as they did on the previous site. */
export const LEGAL_PAGES: Record<string, string> = { privacy: "/privacy", terms: "/terms" };

/** Public URL for a resource. */
export function resourceHref(r: { slug: string }) {
  return LEGAL_PAGES[r.slug] ?? `/resources/${r.slug}`;
}

export type FileMeta = { id: number; resourceId: number; filename: string; contentType: string; size: number };

/** Attached file details (without the bytes) for the given resources, keyed by resource id. */
export async function resourceFileMeta(resourceIds: number[]): Promise<Map<number, FileMeta>> {
  if (!resourceIds.length) return new Map();
  const { inArray } = await import("drizzle-orm");
  const rows = await db.select({ id: s.resourceFiles.id, resourceId: s.resourceFiles.resourceId, filename: s.resourceFiles.filename, contentType: s.resourceFiles.contentType, size: s.resourceFiles.size })
    .from(s.resourceFiles).where(inArray(s.resourceFiles.resourceId, resourceIds));
  return new Map(rows.map((r) => [r.resourceId, r]));
}

export const fileHref = (f: FileMeta) => `/files/${f.id}/${encodeURIComponent(f.filename)}`;

export function fileLabel(f: FileMeta) {
  const ext = f.filename.split(".").pop()?.toUpperCase() ?? "FILE";
  const mb = f.size / 1024 / 1024;
  return `${ext} · ${mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`}`;
}
