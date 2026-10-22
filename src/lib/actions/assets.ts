"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { imageSize } from "image-size";
import { db, schema as s } from "@/db";
import { requireAdmin } from "@/lib/users";
import { ASSET_ALLOWED, ASSET_MAX_BYTES } from "@/lib/assets";

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif",
  pdf: "application/pdf", csv: "text/csv", txt: "text/plain", md: "text/markdown", zip: "application/zip",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const cleanName = (n: string) => n.replace(/[\\/\r\n"]/g, "_").trim().slice(0, 200) || "file";
const titleFrom = (filename: string) => {
  const t = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Read a file from the form, or say why it can't be used. */
async function readUpload(file: File) {
  if (file.size > ASSET_MAX_BYTES) return { error: "filesize" as const };
  if (!ASSET_ALLOWED.test(file.name)) return { error: "filetype" as const };
  const filename = cleanName(file.name);
  const ext = filename.split(".").pop()!.toLowerCase();
  // The type comes from the extension rather than the browser, so what we serve is predictable.
  const contentType = MIME[ext] ?? "application/octet-stream";
  const data = Buffer.from(await file.arrayBuffer());
  let width: number | null = null, height: number | null = null;
  if (contentType.startsWith("image/")) {
    try { const d = imageSize(data); width = d.width ?? null; height = d.height ?? null; } catch { return { error: "image" as const }; }
  }
  return { filename, contentType, size: file.size, data, width, height };
}

function refresh() {
  revalidatePath("/admin/assets");
  revalidatePath("/resources");
}

export async function uploadAssets(formData: FormData) {
  const admin = await requireAdmin("/admin/assets");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) redirect("/admin/assets?error=nofile");
  const rows = [];
  for (const f of files) {
    const r = await readUpload(f);
    if ("error" in r) redirect(`/admin/assets?error=${r.error}&file=${encodeURIComponent(f.name)}`);
    rows.push({ ...r, name: titleFrom(r.filename), createdById: admin.id });
  }
  const added = await db.insert(s.assets).values(rows).returning({ id: s.assets.id });
  refresh();
  redirect(added.length === 1 ? `/admin/assets/${added[0].id}?ok=uploaded` : `/admin/assets?ok=uploaded&n=${added.length}`);
}

export async function updateAsset(formData: FormData) {
  await requireAdmin("/admin/assets");
  const id = Number(formData.get("id"));
  const back = `/admin/assets/${id}`;
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) redirect(`${back}?error=name`);
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 300) || null;
  const upload = formData.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  let replace = {};
  if (file) {
    const r = await readUpload(file);
    if ("error" in r) redirect(`${back}?error=${r.error}`);
    const current = await db.query.assets.findFirst({ where: eq(s.assets.id, id), columns: { contentType: true } });
    // Keep images as images and documents as documents, so places that embed it don't break.
    if (current && current.contentType.startsWith("image/") !== r.contentType.startsWith("image/")) redirect(`${back}?error=kind`);
    replace = r;
  }
  await db.update(s.assets).set({ name, alt, ...replace, updatedAt: new Date() }).where(eq(s.assets.id, id));
  refresh();
  redirect(`${back}?ok=${file ? "replaced" : "saved"}`);
}

export async function deleteAsset(formData: FormData) {
  await requireAdmin("/admin/assets");
  await db.delete(s.assets).where(eq(s.assets.id, Number(formData.get("id"))));
  refresh();
  redirect("/admin/assets?ok=deleted");
}
