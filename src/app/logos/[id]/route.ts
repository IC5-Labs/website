import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getCurrentUser } from "@/lib/users";

/** A company's logo, for that company's members and IC5 Labs admins. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id) || 0;
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.accountId !== id)) return new Response("Not found", { status: 404 });
  const logo = await db.query.accountLogos.findFirst({ where: eq(s.accountLogos.accountId, id) });
  if (!logo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.contentType,
      "Content-Length": String(logo.data.length),
      // The URL carries a version, so a private cache can keep it.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
