import "server-only";
import { and, asc, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";

export const OPEN_STATUSES = ["new", "in_progress", "awaiting_customer"] as const;

export async function listCases(opts: { accountId?: number; filter?: string }) {
  const conds: SQL[] = [];
  if (opts.accountId) conds.push(eq(s.cases.accountId, opts.accountId));
  const f = opts.filter ?? "open";
  if (f === "open") conds.push(inArray(s.cases.status, [...OPEN_STATUSES]));
  else if (f === "resolved") conds.push(eq(s.cases.status, "resolved"));
  else if (f === "closed") conds.push(eq(s.cases.status, "closed"));
  else if (f === "awaiting") conds.push(eq(s.cases.status, "awaiting_customer"));
  return db.select({
    number: s.cases.number, subject: s.cases.subject, severity: s.cases.severity, status: s.cases.status,
    updatedAt: s.cases.updatedAt, createdAt: s.cases.createdAt, productName: s.products.name, accountName: s.accounts.name,
  }).from(s.cases)
    .leftJoin(s.products, eq(s.products.id, s.cases.productId))
    .leftJoin(s.accounts, eq(s.accounts.id, s.cases.accountId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(s.cases.severity), desc(s.cases.updatedAt));
}

export async function caseCounts(accountId?: number) {
  const rows = await db.select({ status: s.cases.status }).from(s.cases).where(accountId ? eq(s.cases.accountId, accountId) : undefined);
  const c = { open: 0, awaiting: 0, resolved: 0, closed: 0, all: rows.length };
  for (const r of rows) {
    if ((OPEN_STATUSES as readonly string[]).includes(r.status)) c.open++;
    if (r.status === "awaiting_customer") c.awaiting++;
    if (r.status === "resolved") c.resolved++;
    if (r.status === "closed") c.closed++;
  }
  return c;
}

export async function accountLicenses(accountId: number) {
  return db.select({ license: s.licenses, product: s.products }).from(s.licenses)
    .innerJoin(s.products, eq(s.products.id, s.licenses.productId))
    .where(eq(s.licenses.accountId, accountId)).orderBy(asc(s.products.sortOrder));
}

export async function accountMembers(accountId: number) {
  return db.select().from(s.users).where(eq(s.users.accountId, accountId)).orderBy(asc(s.users.createdAt));
}

export async function allProducts() {
  return db.select().from(s.products).orderBy(asc(s.products.sortOrder));
}
