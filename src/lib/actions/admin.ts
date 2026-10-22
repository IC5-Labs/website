"use server";
import { redirect } from "next/navigation";
import { sendEmail, siteOrigin } from "@/lib/email";
import { accountCreatedEmail } from "@/lib/email-templates";
import { saveCompanyDetails } from "@/lib/company";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { requireAdmin } from "@/lib/users";
import { slugify } from "@/lib/format";

const opt = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t ? t : null;
};

/* ---------- resources: blog posts, documents, insights ---------- */
const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Document formats admins can attach for download. */
const ALLOWED_FILE = /\.(pdf|docx?|xlsx?|pptx?|csv|txt|md|zip|png|jpe?g)$/i;
const resourceSchema = z.object({
  type: z.enum(["blog", "document", "insight"]),
  title: z.string().trim().min(3).max(300),
  status: z.enum(["draft", "published"]),
});

export async function saveResource(formData: FormData) {
  const admin = await requireAdmin("/admin/resources");
  const id = Number(formData.get("id")) || null;
  const parsed = resourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/resources/${id ?? "new"}?error=invalid`);
  const d = parsed.data;
  const slug = slugify(String(formData.get("slug") || d.title));
  const clash = await db.query.resources.findFirst({ where: id ? and(eq(s.resources.slug, slug), ne(s.resources.id, id)) : eq(s.resources.slug, slug) });
  if (clash) redirect(`/admin/resources/${id ?? "new"}?error=slug`);
  const existing = id ? await db.query.resources.findFirst({ where: eq(s.resources.id, id) }) : null;
  const pub = opt(formData.get("publishedAt"));
  const values = {
    type: d.type, title: d.title, status: d.status, slug,
    summary: opt(formData.get("summary")), body: String(formData.get("body") ?? ""), category: opt(formData.get("category")),
    authorName: opt(formData.get("authorName")), authorTitle: opt(formData.get("authorTitle")), heroImage: opt(formData.get("heroImage")),
    productId: Number(formData.get("productId")) || null,
    publishedAt: pub ? new Date(pub) : d.status === "published" ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
    updatedAt: new Date(),
  };
  const upload = formData.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  if (file) {
    if (file.size > MAX_FILE_BYTES) redirect(`/admin/resources/${id ?? "new"}?error=filesize`);
    if (!ALLOWED_FILE.test(file.name)) redirect(`/admin/resources/${id ?? "new"}?error=filetype`);
  }
  let resourceId = id;
  if (id) await db.update(s.resources).set(values).where(eq(s.resources.id, id));
  else resourceId = (await db.insert(s.resources).values({ ...values, createdById: admin.id }).returning({ id: s.resources.id }))[0].id;
  if (file) {
    const row = { filename: file.name.replace(/[\\/\r\n"]/g, "_").slice(0, 200), contentType: file.type || "application/octet-stream", size: file.size, data: Buffer.from(await file.arrayBuffer()), createdAt: new Date() };
    await db.insert(s.resourceFiles).values({ resourceId: resourceId!, ...row })
      .onConflictDoUpdate({ target: s.resourceFiles.resourceId, set: row });
  } else if (formData.get("removeFile") === "on" && resourceId) {
    await db.delete(s.resourceFiles).where(eq(s.resourceFiles.resourceId, resourceId));
  }
  revalidatePath("/resources");
  redirect(`/admin/resources?ok=saved`);
}

export async function deleteResource(formData: FormData) {
  await requireAdmin("/admin/resources");
  await db.delete(s.resources).where(eq(s.resources.id, Number(formData.get("id"))));
  revalidatePath("/resources");
  redirect("/admin/resources?ok=deleted");
}

/* ---------- documentation ---------- */
const docSchema = z.object({
  productId: z.coerce.number().int().positive(),
  version: z.string().trim().regex(/^\d+(\.\d+){0,3}$/, "Use a version like 1.2"),
  versionStatus: z.enum(["latest", "supported", "deprecated", "draft"]),
  title: z.string().trim().min(2).max(200),
  section: z.string().trim().min(2).max(80),
  body: z.string().min(1),
  sortOrder: z.coerce.number().int().default(0),
});

async function applyVersionStatus(productId: number, version: string, status: "latest" | "supported" | "deprecated" | "draft") {
  if (status === "latest") {
    await db.update(s.documentation).set({ versionStatus: "supported" })
      .where(and(eq(s.documentation.productId, productId), eq(s.documentation.versionStatus, "latest"), ne(s.documentation.version, version)));
  }
  await db.update(s.documentation).set({ versionStatus: status }).where(and(eq(s.documentation.productId, productId), eq(s.documentation.version, version)));
}

export async function saveDoc(formData: FormData) {
  await requireAdmin("/admin/docs");
  const id = Number(formData.get("id")) || null;
  const parsed = docSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/docs/${id ?? "new"}?error=invalid`);
  const d = parsed.data;
  const slug = slugify(String(formData.get("slug") || d.title));
  const clash = await db.query.documentation.findFirst({
    where: and(eq(s.documentation.productId, d.productId), eq(s.documentation.version, d.version), eq(s.documentation.slug, slug), ...(id ? [ne(s.documentation.id, id)] : [])),
  });
  if (clash) redirect(`/admin/docs/${id ?? "new"}?error=slug`);
  const values = { ...d, slug, summary: opt(formData.get("summary")), updatedAt: new Date() };
  if (id) await db.update(s.documentation).set(values).where(eq(s.documentation.id, id));
  else await db.insert(s.documentation).values(values);
  await applyVersionStatus(d.productId, d.version, d.versionStatus);
  revalidatePath("/docs");
  redirect("/admin/docs?ok=saved");
}

export async function deleteDoc(formData: FormData) {
  await requireAdmin("/admin/docs");
  await db.delete(s.documentation).where(eq(s.documentation.id, Number(formData.get("id"))));
  revalidatePath("/docs");
  redirect("/admin/docs?ok=deleted");
}

export async function setDocVersionStatus(formData: FormData) {
  await requireAdmin("/admin/docs");
  const productId = Number(formData.get("productId"));
  const version = String(formData.get("version"));
  const status = z.enum(["latest", "supported", "deprecated", "draft"]).parse(formData.get("versionStatus"));
  await applyVersionStatus(productId, version, status);
  revalidatePath("/docs");
  redirect("/admin/docs?ok=status");
}

/** Start a new version by copying every page of an existing one. New version starts as a draft. */
export async function copyDocVersion(formData: FormData) {
  await requireAdmin("/admin/docs");
  const productId = Number(formData.get("productId"));
  const from = String(formData.get("from"));
  const to = z.string().trim().regex(/^\d+(\.\d+){0,3}$/).safeParse(formData.get("to"));
  if (!to.success) redirect("/admin/docs?error=version");
  const exists = await db.query.documentation.findFirst({ where: and(eq(s.documentation.productId, productId), eq(s.documentation.version, to.data)) });
  if (exists) redirect("/admin/docs?error=exists");
  const pages = await db.select().from(s.documentation).where(and(eq(s.documentation.productId, productId), eq(s.documentation.version, from)));
  if (pages.length) {
    await db.insert(s.documentation).values(pages.map(({ id: _id, ...p }) => ({ ...p, version: to.data, versionStatus: "draft" as const, updatedAt: new Date() })));
  }
  revalidatePath("/docs");
  redirect(`/admin/docs?ok=copied`);
}

/* ---------- users ---------- */
export async function adminUpdateUser(formData: FormData) {
  const me = await requireAdmin("/admin/users");
  const id = Number(formData.get("id"));
  const role = formData.get("role") === "admin" ? "admin" : "user";
  if (id === me.id && role !== "admin") redirect("/admin/users?error=self");
  const accountId = Number(formData.get("accountId")) || null;
  const accountRole = accountId ? (formData.get("accountRole") === "account_admin" ? "account_admin" : "member") : null;
  await db.update(s.users).set({ role, accountId, accountRole }).where(eq(s.users.id, id));
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=saved");
}

export async function adminInviteUser(formData: FormData) {
  const me = await requireAdmin("/admin/users");
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) redirect("/admin/users?error=email");
  const exists = await db.query.users.findFirst({ where: eq(s.users.email, email.data) });
  if (exists) redirect("/admin/users?error=exists");
  const accountId = Number(formData.get("accountId")) || null;
  const [created] = await db.insert(s.users).values({
    email: email.data, name: opt(formData.get("name")), role: formData.get("role") === "admin" ? "admin" : "user",
    accountId, accountRole: accountId ? (formData.get("accountRole") === "account_admin" ? "account_admin" : "member") : null,
  }).returning();
  // Tell the new user about their account and who set it up.
  const account = accountId ? await db.query.accounts.findFirst({ where: eq(s.accounts.id, accountId) }) : null;
  const mail = accountCreatedEmail({
    origin: await siteOrigin(), to: created, by: me,
    accountName: account?.name, accountRole: created.accountRole, siteAdmin: created.role === "admin",
  });
  const sent = await sendEmail({ to: created.email, replyTo: me.email, ...mail });
  revalidatePath("/admin/users");
  redirect(`/admin/users?ok=created&mail=${sent}`);
}

/** Permanently remove a user. Their cases, comments and requests stay, with no author shown. */
export async function adminDeleteUser(formData: FormData) {
  const me = await requireAdmin("/admin/users");
  const id = Number(formData.get("id"));
  if (id === me.id) redirect("/admin/users?error=deleteself");
  const target = await db.query.users.findFirst({ where: eq(s.users.id, id) });
  if (!target) redirect("/admin/users?error=notfound");
  // Don't leave a company with members but no one who can manage it.
  if (target.accountId && target.accountRole === "account_admin") {
    const others = await db.select({ id: s.users.id, role: s.users.accountRole }).from(s.users)
      .where(and(eq(s.users.accountId, target.accountId), ne(s.users.id, target.id)));
    if (others.length && !others.some((o) => o.role === "account_admin")) redirect("/admin/users?error=lastadmin");
  }
  await db.delete(s.users).where(eq(s.users.id, target.id));
  revalidatePath("/admin/users");
  redirect(`/admin/users?ok=deleted&who=${encodeURIComponent(target.email)}`);
}

/* ---------- accounts and licenses ---------- */
export async function adminUpdateCompany(formData: FormData) {
  await requireAdmin("/admin/accounts");
  const id = Number(formData.get("accountId"));
  const error = await saveCompanyDetails(id, formData);
  if (error) redirect(`/admin/accounts/${id}?error=company-${error}`);
  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts/${id}?ok=company`);
}

export async function adminCreateAccount(formData: FormData) {
  await requireAdmin("/admin/accounts");
  const name = z.string().trim().min(2).max(120).safeParse(formData.get("name"));
  const domain = z.string().trim().toLowerCase().min(3).max(120).safeParse(formData.get("domain"));
  if (!name.success || !domain.success) redirect("/admin/accounts?error=invalid");
  const clash = await db.query.accounts.findFirst({ where: eq(s.accounts.domain, domain.data) });
  if (clash) redirect("/admin/accounts?error=domain");
  const [a] = await db.insert(s.accounts).values({ name: name.data, domain: domain.data }).returning();
  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts/${a.id}?ok=created`);
}

const licenseSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  productId: z.coerce.number().int().positive(),
  status: z.enum(["active", "trial", "expired", "cancelled"]),
  startsAt: z.string().min(8),
  endsAt: z.string().min(8),
});

export async function saveLicense(formData: FormData) {
  await requireAdmin("/admin/accounts");
  const id = Number(formData.get("id")) || null;
  const parsed = licenseSchema.safeParse(Object.fromEntries(formData));
  const accountId = Number(formData.get("accountId"));
  if (!parsed.success) redirect(`/admin/accounts/${accountId}?error=license`);
  const d = parsed.data;
  const seats = Number(formData.get("seats")) || null;
  const values = {
    accountId: d.accountId, productId: d.productId, status: d.status, plan: opt(formData.get("plan")), seats,
    instance: opt(formData.get("instance")), version: opt(formData.get("version")),
    startsAt: new Date(d.startsAt), endsAt: new Date(d.endsAt),
  };
  if (id) await db.update(s.licenses).set(values).where(eq(s.licenses.id, id));
  else await db.insert(s.licenses).values(values);
  revalidatePath(`/admin/accounts/${accountId}`);
  redirect(`/admin/accounts/${accountId}?ok=license`);
}

export async function deleteLicense(formData: FormData) {
  await requireAdmin("/admin/accounts");
  const accountId = Number(formData.get("accountId"));
  await db.delete(s.licenses).where(and(eq(s.licenses.id, Number(formData.get("id"))), eq(s.licenses.accountId, accountId)));
  redirect(`/admin/accounts/${accountId}?ok=deleted`);
}

/* ---------- requests ---------- */
export async function setRequestStatus(formData: FormData) {
  await requireAdmin("/admin/requests");
  const status = z.enum(["new", "contacted", "closed"]).parse(formData.get("status"));
  await db.update(s.requests).set({ status }).where(eq(s.requests.id, Number(formData.get("id"))));
  revalidatePath("/admin/requests");
  redirect(`/admin/requests?${new URLSearchParams({ type: String(formData.get("filterType") ?? ""), ok: "1" })}`);
}
