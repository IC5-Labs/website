import "server-only";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { auth } from "@/auth";
import type { User } from "@/db/schema";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com",
  "me.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com",
]);

export function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}
export function isPublicDomain(domain: string) {
  return PUBLIC_EMAIL_DOMAINS.has(domain);
}

/** Create or refresh the user row, and accept any pending invite for this email. */
export async function upsertUserOnSignIn(p: { email: string; name: string | null; image: string | null; provider: string }) {
  const email = p.email.toLowerCase();
  let user = await db.query.users.findFirst({ where: eq(s.users.email, email) });
  if (!user) {
    [user] = await db.insert(s.users).values({ email, name: p.name, image: p.image, provider: p.provider, lastLoginAt: new Date() }).returning();
  } else {
    [user] = await db.update(s.users)
      .set({ name: user.name ?? p.name, image: p.image ?? user.image, provider: p.provider, lastLoginAt: new Date() })
      .where(eq(s.users.id, user.id)).returning();
  }
  if (!user.accountId) await acceptPendingInvite(user);
  return user;
}

export async function acceptPendingInvite(user: User, token?: string) {
  const invite = await db.query.invites.findFirst({
    where: token
      ? and(eq(s.invites.token, token), eq(s.invites.status, "pending"))
      : and(eq(s.invites.email, user.email), eq(s.invites.status, "pending")),
  });
  if (!invite || invite.email !== user.email || user.accountId) return null;
  await db.update(s.users).set({ accountId: invite.accountId, accountRole: invite.accountRole }).where(eq(s.users.id, user.id));
  await db.update(s.invites).set({ status: "accepted", acceptedAt: new Date() }).where(eq(s.invites.id, invite.id));
  return invite;
}

/** The signed-in user from the database (authoritative for roles), or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return (await db.query.users.findFirst({ where: eq(s.users.email, email) })) ?? null;
}

export async function requireUser(callbackUrl = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** Signed-in user who belongs to a company account. */
export async function requireAccountUser(callbackUrl = "/account") {
  const user = await requireUser(callbackUrl);
  if (!user.accountId) redirect("/onboarding");
  const account = await db.query.accounts.findFirst({ where: eq(s.accounts.id, user.accountId) });
  if (!account) redirect("/onboarding");
  return { user, account };
}

export async function requireAdmin(callbackUrl = "/admin") {
  const user = await requireUser(callbackUrl);
  if (user.role !== "admin") redirect("/account");
  return user;
}

export const isAdmin = (u: User | null) => u?.role === "admin";
export const isAccountAdmin = (u: User | null) => !!u && !!u.accountId && u.accountRole === "account_admin";

export function initials(u: { name?: string | null; email: string }) {
  const src = (u.name || u.email.split("@")[0]).replace(/[^A-Za-z ]/g, " ").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "")).toUpperCase();
}
