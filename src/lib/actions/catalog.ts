"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { requireAdmin } from "@/lib/users";
import { slugify } from "@/lib/format";
import { pageFromForm } from "@/lib/catalog-copy";

const opt = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t ? t : null;
};
const num = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").replace(/[$,\s]/g, "");
  return t === "" ? null : Number.isFinite(Number(t)) ? Math.round(Number(t)) : NaN;
};
const lines = (v: FormDataEntryValue | null) => String(v ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

function refresh() {
  for (const p of ["/", "/products", "/agents", "/pricing", "/docs", "/resources", "/admin/products"]) revalidatePath(p);
}

/* ---------- products ---------- */
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(1).max(12),
  kind: z.enum(["app", "store_app"]),
});

export async function saveProduct(formData: FormData) {
  await requireAdmin("/admin/products");
  const id = Number(formData.get("id")) || null;
  const back = `/admin/products/${id ?? "new"}`;
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${back}?error=invalid`);
  const d = parsed.data;
  const slug = slugify(String(formData.get("slug") || d.name));
  const clash = await db.query.products.findFirst({ where: id ? and(eq(s.products.slug, slug), ne(s.products.id, id)) : eq(s.products.slug, slug) });
  if (clash) redirect(`${back}?error=slug`);
  const priceAnnual = num(formData.get("priceAnnual"));
  const userLimit = num(formData.get("userLimit"));
  if (Number.isNaN(priceAnnual) || Number.isNaN(userLimit)) redirect(`${back}?error=number`);
  const values = {
    name: d.name, shortName: d.shortName, kind: d.kind, slug,
    tagline: opt(formData.get("tagline")), description: opt(formData.get("description")),
    plan: opt(formData.get("plan")), priceAnnual, userLimit,
    features: lines(formData.get("features")),
    hasDocs: formData.get("hasDocs") === "on",
    active: formData.get("active") === "on",
    sortOrder: Number(formData.get("sortOrder")) || 0,
    page: pageFromForm(formData),
  };
  const before = id ? await db.query.products.findFirst({ where: eq(s.products.id, id) }) : null;
  if (id) await db.update(s.products).set(values).where(eq(s.products.id, id));
  else await db.insert(s.products).values(values);
  // Agents are grouped by their app's name, so keep them attached when an app is renamed.
  if (before && before.name !== d.name) await db.update(s.agents).set({ appName: d.name }).where(eq(s.agents.appName, before.name));
  refresh();
  redirect("/admin/products?ok=product");
}

/* ---------- agents ---------- */
const agentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  appName: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(600),
});

export async function saveAgent(formData: FormData) {
  await requireAdmin("/admin/products");
  const id = Number(formData.get("id")) || null;
  const back = `/admin/products/agents/${id ?? "new"}`;
  const parsed = agentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${back}?error=invalid`);
  const d = parsed.data;
  const slug = slugify(String(formData.get("slug") || d.name));
  const clash = await db.query.agents.findFirst({ where: id ? and(eq(s.agents.slug, slug), ne(s.agents.id, id)) : eq(s.agents.slug, slug) });
  if (clash) redirect(`${back}?error=slug`);
  const values = {
    name: d.name, appName: d.appName, description: d.description, slug,
    productId: Number(formData.get("productId")) || null,
    tier: opt(formData.get("tier")),
    live: formData.get("live") === "on",
    active: formData.get("active") === "on",
    sortOrder: Number(formData.get("sortOrder")) || 0,
    page: pageFromForm(formData),
  };
  if (id) await db.update(s.agents).set(values).where(eq(s.agents.id, id));
  else await db.insert(s.agents).values(values);
  refresh();
  redirect("/admin/products?ok=agent");
}

/** Show or hide a product or agent across the site without editing anything else. */
export async function setCatalogActive(formData: FormData) {
  await requireAdmin("/admin/products");
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (formData.get("kind") === "agent") await db.update(s.agents).set({ active }).where(eq(s.agents.id, id));
  else await db.update(s.products).set({ active }).where(eq(s.products.id, id));
  refresh();
  redirect(`/admin/products?ok=${active ? "activated" : "deactivated"}`);
}
