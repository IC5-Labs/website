"use server";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { sendEmail, siteOrigin } from "@/lib/email";
import { teamInviteEmail } from "@/lib/email-templates";
import { acceptPendingInvite, emailDomain, isPublicDomain, requireAccountUser, requireUser } from "@/lib/users";

const emailSchema = z.string().trim().toLowerCase().email().max(200);

/** First user from a company creates the company account and becomes its account admin. */
export async function createCompanyAccount(formData: FormData) {
  const user = await requireUser("/onboarding");
  if (user.accountId) redirect("/account");
  const name = z.string().trim().min(2).max(120).safeParse(formData.get("name"));
  if (!name.success) redirect("/onboarding?error=name");
  const domain = emailDomain(user.email);
  const key = isPublicDomain(domain) ? `personal:${user.email}` : domain;
  const taken = await db.query.accounts.findFirst({ where: eq(s.accounts.domain, key) });
  if (taken) redirect("/onboarding?error=taken");
  const [account] = await db.insert(s.accounts).values({ name: name.data, domain: key, createdById: user.id }).returning();
  await db.update(s.users).set({ accountId: account.id, accountRole: "account_admin" }).where(eq(s.users.id, user.id));
  redirect("/account?welcome=1");
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const user = await requireUser(`/invite/${token}`);
  if (user.accountId) redirect(`/invite/${token}?error=member`);
  const invite = await acceptPendingInvite(user, token);
  if (!invite) redirect(`/invite/${token}?error=invalid`);
  redirect("/account?joined=1");
}

async function requireAccountAdmin() {
  const ctx = await requireAccountUser("/account/team");
  if (ctx.user.accountRole !== "account_admin") redirect("/account/team?error=forbidden");
  return ctx;
}

export async function inviteMember(formData: FormData) {
  const { user, account } = await requireAccountAdmin();
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) redirect("/account/team?error=email");
  const role = formData.get("accountRole") === "account_admin" ? "account_admin" : "member";
  const existing = await db.query.users.findFirst({ where: eq(s.users.email, email.data) });
  if (existing?.accountId === account.id) redirect("/account/team?error=already");
  if (existing?.accountId) redirect("/account/team?error=other");
  const pending = await db.query.invites.findFirst({
    where: and(eq(s.invites.accountId, account.id), eq(s.invites.email, email.data), eq(s.invites.status, "pending")),
  });
  let token: string;
  if (pending) {
    await db.update(s.invites).set({ accountRole: role }).where(eq(s.invites.id, pending.id));
    token = pending.token;
  } else {
    token = randomBytes(24).toString("base64url");
    await db.insert(s.invites).values({ token, accountId: account.id, email: email.data, accountRole: role, invitedById: user.id });
  }
  // Email the invitation; sending again for a pending invite works as a resend.
  const mail = teamInviteEmail({ origin: await siteOrigin(), to: email.data, by: user, accountName: account.name, accountRole: role, token });
  const sent = await sendEmail({ to: email.data, replyTo: user.email, ...mail });
  revalidatePath("/account/team");
  redirect(`/account/team?invited=${encodeURIComponent(email.data)}&mail=${sent}`);
}

export async function revokeInvite(formData: FormData) {
  const { account } = await requireAccountAdmin();
  const id = Number(formData.get("id"));
  await db.update(s.invites).set({ status: "revoked" }).where(and(eq(s.invites.id, id), eq(s.invites.accountId, account.id)));
  revalidatePath("/account/team");
  redirect("/account/team?ok=revoked");
}

async function otherAdminsCount(accountId: number, excludeUserId: number) {
  const rows = await db.select({ id: s.users.id }).from(s.users)
    .where(and(eq(s.users.accountId, accountId), eq(s.users.accountRole, "account_admin"), ne(s.users.id, excludeUserId)));
  return rows.length;
}

export async function setMemberRole(formData: FormData) {
  const { account } = await requireAccountAdmin();
  const userId = Number(formData.get("userId"));
  const role = formData.get("accountRole") === "account_admin" ? "account_admin" : "member";
  const target = await db.query.users.findFirst({ where: and(eq(s.users.id, userId), eq(s.users.accountId, account.id)) });
  if (!target) redirect("/account/team?error=notfound");
  if (role === "member" && target.accountRole === "account_admin" && (await otherAdminsCount(account.id, target.id)) === 0) {
    redirect("/account/team?error=lastadmin");
  }
  await db.update(s.users).set({ accountRole: role }).where(eq(s.users.id, target.id));
  revalidatePath("/account/team");
  redirect("/account/team?ok=role");
}

export async function removeMember(formData: FormData) {
  const { account } = await requireAccountAdmin();
  const userId = Number(formData.get("userId"));
  const target = await db.query.users.findFirst({ where: and(eq(s.users.id, userId), eq(s.users.accountId, account.id)) });
  if (!target) redirect("/account/team?error=notfound");
  if (target.accountRole === "account_admin" && (await otherAdminsCount(account.id, target.id)) === 0) redirect("/account/team?error=lastadmin");
  await db.update(s.users).set({ accountId: null, accountRole: null }).where(eq(s.users.id, target.id));
  revalidatePath("/account/team");
  redirect("/account/team?ok=removed");
}

export async function updateLicenseInstance(formData: FormData) {
  const { account } = await requireAccountAdmin();
  const id = Number(formData.get("id"));
  const instance = z.string().trim().max(200).parse(formData.get("instance") ?? "");
  await db.update(s.licenses).set({ instance: instance || null }).where(and(eq(s.licenses.id, id), eq(s.licenses.accountId, account.id)));
  revalidatePath("/account/licenses");
  redirect("/account/licenses?ok=instance");
}

/** Requests from signed-in customers: license changes, information requests, and ideas. */
export async function createAccountRequest(formData: FormData) {
  const { user, account } = await requireAccountUser("/account/requests");
  const raw = formData.get("type");
  const type = raw === "license" ? "license" : raw === "idea" ? "idea" : "information";
  const message = z.string().trim().min(3).max(4000).safeParse(formData.get("message"));
  const back = String(formData.get("back") ?? "/account/requests");
  if (!message.success) redirect(`${back}?error=${type === "idea" ? "idea" : "message"}`);
  const details: Record<string, unknown> = {};
  for (const k of ["topic", "licenseId", "productId", "change", "title", "kind", "impact"]) {
    const v = String(formData.get(k) ?? "").trim().slice(0, 500);
    if (v) details[k] = v;
  }
  if (type === "idea") {
    if (!details.title) redirect(`${back}?error=idea`);
    details.kind = details.kind === "experience" ? "experience" : "feature";
    // Keep the product's name with the idea so it reads correctly even if the product is renamed or retired.
    const pid = Number(details.productId);
    const product = pid ? await db.query.products.findFirst({ where: eq(s.products.id, pid) }) : null;
    if (product) details.product = product.name;
    else delete details.productId;
  }
  await db.insert(s.requests).values({
    type, email: user.email, name: user.name, company: account.name, message: message.data, details, accountId: account.id, userId: user.id,
  });
  revalidatePath("/account/requests");
  redirect(`/account/requests?ok=${type === "idea" ? "idea" : "sent"}`);
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/account/profile");
  const name = z.string().trim().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) redirect("/account/profile?error=name");
  await db.update(s.users).set({ name: name.data }).where(eq(s.users.id, user.id));
  revalidatePath("/account");
  redirect("/account/profile?ok=1");
}
