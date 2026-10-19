"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { requireAccountUser, requireUser } from "@/lib/users";
import { loadCaseForUser } from "@/lib/cases";
import type { Case } from "@/db/schema";

const caseSchema = z.object({
  productId: z.coerce.number().int().positive(),
  version: z.string().trim().max(40).optional(),
  instance: z.string().trim().max(200).optional(),
  environment: z.enum(["production", "sub_production"]),
  severity: z.coerce.number().int().min(1).max(4),
  subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(20000),
});

export async function createCase(formData: FormData) {
  const { user, account } = await requireAccountUser("/account/cases/new");
  const parsed = caseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/account/cases/new?error=1");
  const d = parsed.data;
  const [row] = await db.insert(s.cases).values({
    number: `pending-${crypto.randomUUID()}`, accountId: account.id, productId: d.productId, version: d.version || null,
    instance: d.instance || null, environment: d.environment, severity: d.severity, subject: d.subject, description: d.description,
    openedById: user.id,
  }).returning();
  const number = `CS${String(1001000 + row.id).padStart(7, "0")}`;
  await db.update(s.cases).set({ number }).where(eq(s.cases.id, row.id));
  revalidatePath("/account/cases");
  redirect(`/account/cases/${number}?created=1`);
}

function casePath(number: string, admin: boolean) {
  return admin ? `/admin/cases/${number}` : `/account/cases/${number}`;
}

export async function addCaseComment(formData: FormData) {
  const number = String(formData.get("number") ?? "");
  const ctx = await loadCaseForUser(number);
  if (!ctx) redirect("/account/cases");
  const { user, c } = ctx;
  const admin = user.role === "admin";
  const body = z.string().trim().min(1).max(20000).safeParse(formData.get("body"));
  if (!body.success) redirect(`${casePath(number, admin)}?error=empty#reply`);
  const internal = admin && formData.get("internal") === "on";
  await db.insert(s.caseComments).values({ caseId: c.id, authorId: user.id, body: body.data, fromSupport: admin, internal });
  const patch: Partial<Case> = { updatedAt: new Date() };
  if (admin && !internal) {
    if (!c.firstResponseAt) patch.firstResponseAt = new Date();
    const next = String(formData.get("status") ?? "");
    if (["new", "in_progress", "awaiting_customer", "resolved", "closed"].includes(next)) patch.status = next as Case["status"];
    else if (c.status === "new") patch.status = "in_progress";
  } else if (!admin && ["awaiting_customer", "resolved"].includes(c.status)) {
    patch.status = "in_progress";
  }
  await db.update(s.cases).set(patch).where(eq(s.cases.id, c.id));
  revalidatePath(casePath(number, admin));
  redirect(`${casePath(number, admin)}?ok=reply`);
}

/** Customers can close or reopen their cases. */
export async function customerSetCaseStatus(formData: FormData) {
  const number = String(formData.get("number") ?? "");
  const { user, c } = (await loadCaseForUser(number)) ?? redirect("/account/cases");
  await requireUser();
  const action = formData.get("action");
  const status = action === "close" ? "closed" : action === "reopen" ? "in_progress" : null;
  if (!status) redirect(`/account/cases/${number}`);
  await db.update(s.cases).set({ status, updatedAt: new Date() }).where(eq(s.cases.id, c.id));
  await db.insert(s.caseComments).values({ caseId: c.id, authorId: user.id, body: status === "closed" ? "Closed the case." : "Reopened the case.", fromSupport: user.role === "admin" });
  revalidatePath(`/account/cases/${number}`);
  redirect(`/account/cases/${number}?ok=${action}`);
}

/** Support staff update status, severity, and assignee. */
export async function adminUpdateCase(formData: FormData) {
  const user = await requireUser("/admin/cases");
  if (user.role !== "admin") redirect("/account");
  const number = String(formData.get("number") ?? "");
  const c = await db.query.cases.findFirst({ where: eq(s.cases.number, number) });
  if (!c) redirect("/admin/cases");
  const status = z.enum(["new", "in_progress", "awaiting_customer", "resolved", "closed"]).parse(formData.get("status"));
  const severity = z.coerce.number().int().min(1).max(4).parse(formData.get("severity"));
  const assigned = Number(formData.get("assignedToId")) || null;
  await db.update(s.cases).set({ status, severity, assignedToId: assigned, updatedAt: new Date() }).where(eq(s.cases.id, c.id));
  revalidatePath(`/admin/cases/${number}`);
  redirect(`/admin/cases/${number}?ok=updated`);
}
