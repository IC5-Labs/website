import "server-only";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getCurrentUser } from "@/lib/users";
import type { Case, User } from "@/db/schema";

/** Load a case the current user may see: admins see all, others only their account's. */
export async function loadCaseForUser(number: string): Promise<{ user: User; c: Case } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const c = await db.query.cases.findFirst({ where: eq(s.cases.number, number) });
  if (!c) return null;
  if (user.role !== "admin" && c.accountId !== user.accountId) return null;
  return { user, c };
}

