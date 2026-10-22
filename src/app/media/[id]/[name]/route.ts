import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/**
 * Serve a library asset. Images and PDFs open in the browser so they can be embedded and
 * previewed; other documents download. Assets are public, like the pages that use them.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await params;
  const a = await db.query.assets.findFirst({ where: eq(s.assets.id, Number(id) || 0) });
  if (!a) return new Response("Not found", { status: 404 });
  const inline = a.contentType.startsWith("image/") || a.contentType === "application/pdf";
  const ascii = a.filename.replace(/[^\x20-\x7e]/g, "_");
  return new Response(new Uint8Array(a.data), {
    headers: {
      "Content-Type": a.contentType,
      "Content-Length": String(a.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(a.filename)}`,
      // Short cache: replacing a file keeps its URL, so visitors should see the new one soon.
      "Cache-Control": "public, max-age=300",
      "Last-Modified": a.updatedAt.toUTCString(),
      "X-Content-Type-Options": "nosniff",
      // Locks down anything opened directly; left off PDFs because browsers won't show a PDF in a sandbox.
      ...(a.contentType === "application/pdf" ? {} : { "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }),
    },
  });
}
