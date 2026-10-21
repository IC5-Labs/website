import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getCurrentUser } from "@/lib/users";

/** Download a file attached to a resource. Drafts are only available to admins. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await params;
  const [row] = await db.select({ f: s.resourceFiles, status: s.resources.status }).from(s.resourceFiles)
    .innerJoin(s.resources, eq(s.resources.id, s.resourceFiles.resourceId))
    .where(eq(s.resourceFiles.id, Number(id) || 0));
  if (!row) return new Response("Not found", { status: 404 });
  if (row.status !== "published" && (await getCurrentUser())?.role !== "admin") return new Response("Not found", { status: 404 });
  const { f } = row;
  const ascii = f.filename.replace(/[^\x20-\x7e]/g, "_");
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.contentType,
      "Content-Length": String(f.size),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(f.filename)}`,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
