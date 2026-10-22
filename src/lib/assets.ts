import "server-only";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** Library entry without the file bytes, for lists and pickers. */
export type AssetMeta = { id: number; name: string; filename: string; alt: string | null; contentType: string; size: number; width: number | null; height: number | null; updatedAt: Date };

export const ASSET_MAX_BYTES = 25 * 1024 * 1024;
/** SVG is left out on purpose: it can carry script, and these files are served from the site's own domain. */
export const ASSET_ALLOWED = /\.(png|jpe?g|gif|webp|avif|pdf|docx?|xlsx?|pptx?|csv|txt|md|zip)$/i;
export const ASSET_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.avif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.zip";

export const ASSET_ERRORS: Record<string, string> = {
  nofile: "Choose at least one file to upload.",
  filesize: "Files can be up to 25 MB each.",
  filetype: "Upload an image (PNG, JPG, GIF, WebP, AVIF) or a document (PDF, Word, Excel, PowerPoint, CSV, text, Markdown, ZIP). SVG isn’t accepted.",
  image: "That image couldn’t be read. Try saving it again as PNG or JPG.",
  kind: "Replace an image with another image, and a document with another document, so the places that use it keep working.",
  name: "Give the asset a name.",
};

const IMAGE = /^image\/(png|jpeg|gif|webp|avif)$/;
export const isImage = (a: { contentType: string }) => IMAGE.test(a.contentType);

/** Public URL. The id keeps the link stable when the file is renamed or replaced. */
export const assetHref = (a: { id: number; filename: string }) => `/media/${a.id}/${encodeURIComponent(a.filename)}`;

/** Markdown that drops the asset into a resource body: an image, or a download link. */
export const assetMarkdown = (a: AssetMeta) =>
  isImage(a) ? `![${(a.alt || a.name).replace(/[[\]]/g, "")}](${assetHref(a)})` : `[${a.name.replace(/[[\]]/g, "")}](${assetHref(a)})`;

export function assetLabel(a: { filename: string; size: number; width?: number | null; height?: number | null }) {
  const ext = a.filename.split(".").pop()?.toUpperCase() ?? "FILE";
  const mb = a.size / 1024 / 1024;
  const size = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(a.size / 1024))} KB`;
  return [ext, a.width && a.height ? `${a.width} × ${a.height}` : null, size].filter(Boolean).join(" · ");
}

const metaCols = {
  id: s.assets.id, name: s.assets.name, filename: s.assets.filename, alt: s.assets.alt, contentType: s.assets.contentType,
  size: s.assets.size, width: s.assets.width, height: s.assets.height, updatedAt: s.assets.updatedAt,
};

export async function listAssets(): Promise<AssetMeta[]> {
  return db.select(metaCols).from(s.assets).orderBy(desc(s.assets.updatedAt), desc(s.assets.id));
}

export async function getAssetMeta(id: number): Promise<AssetMeta | undefined> {
  return (await db.select(metaCols).from(s.assets).where(eq(s.assets.id, id)))[0];
}

/** Resources and documentation pages whose text or hero image point at this asset. */
export async function assetUsage(id: number) {
  const needle = `%/media/${id}/%`;
  const [resources, docs] = await Promise.all([
    db.select({ id: s.resources.id, title: s.resources.title, type: s.resources.type, status: s.resources.status })
      .from(s.resources).where(or(ilike(s.resources.body, needle), ilike(s.resources.heroImage, needle))),
    db.select({ id: s.documentation.id, title: s.documentation.title, version: s.documentation.version })
      .from(s.documentation).where(ilike(s.documentation.body, needle)),
  ]);
  return { resources, docs, count: resources.length + docs.length };
}

/** How many places use each asset, for the library grid. */
export async function usageCounts(ids: number[]) {
  const counts = new Map<number, number>(ids.map((i) => [i, 0]));
  if (!ids.length) return counts;
  const [res, docs] = await Promise.all([
    db.select({ body: s.resources.body, hero: s.resources.heroImage }).from(s.resources).where(or(ilike(s.resources.body, "%/media/%"), ilike(s.resources.heroImage, "%/media/%"))),
    db.select({ body: s.documentation.body }).from(s.documentation).where(ilike(s.documentation.body, "%/media/%")),
  ]);
  const texts = [...res.map((r) => `${r.body} ${r.hero ?? ""}`), ...docs.map((d) => d.body)];
  for (const t of texts) {
    const seen = new Set<number>();
    for (const m of t.matchAll(/\/media\/(\d+)\//g)) seen.add(Number(m[1]));
    for (const i of seen) if (counts.has(i)) counts.set(i, counts.get(i)! + 1);
  }
  return counts;
}

/** The library in the shape the editor pickers need. */
export async function pickerAssets() {
  return (await listAssets()).map((a) => ({
    id: a.id, name: a.name, href: assetHref(a), markdown: assetMarkdown(a), image: isImage(a),
    label: assetLabel(a), ext: a.filename.split(".").pop()?.toUpperCase() ?? "FILE",
  }));
}
