import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { selectableProducts } from "@/lib/queries";
import { Flash } from "@/components/site";
import { deleteResource, saveResource } from "@/lib/actions/admin";
import { fileHref, fileLabel, resourceFileMeta, resourceHref } from "@/lib/content";
import { HeroPicker, InsertAsset } from "@/components/asset-tools";
import { pickerAssets } from "@/lib/assets";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit resource" };

const ERR: Record<string, string> = { filesize: "Files can be up to 25 MB.", filetype: "Upload a PDF, Word, Excel, PowerPoint, CSV, text, ZIP, or image file.", invalid: "Add a title (3+ characters) and choose a type and status.", slug: "Another resource already uses that URL slug." };

export default async function EditResource({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const r = isNew ? null : await db.query.resources.findFirst({ where: eq(s.resources.id, Number(id)) });
  if (!isNew && !r) notFound();
  const type = r?.type ?? (sp.type === "document" || sp.type === "insight" ? sp.type : "blog");
  const products = await selectableProducts([r?.productId]);
  const file = r ? (await resourceFileMeta([r.id])).get(r.id) : undefined;
  const library = await pickerAssets();
  const pub = r?.publishedAt ? new Date(r.publishedAt).toISOString().slice(0, 10) : "";
  return (
    <>
      <div className="crumb2"><Link href="/admin">Admin</Link> / <Link href="/admin/resources">Blog and resources</Link> / <b>{isNew ? "New" : r!.title.slice(0, 40)}</b></div>
      {sp.error && <Flash err={ERR[sp.error] ?? "Couldn’t save."} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>{isNew ? `New ${type === "blog" ? "blog post" : type}` : "Edit resource"}</h1></div>
        {r && <div className="ahead-act"><Link className="btn btn-ghost2" href={resourceHref(r)}>{r.status === "published" ? "View live" : "Preview draft"}</Link></div>}</div>
      <form action={saveResource} className="panel">
        {r && <input type="hidden" name="id" value={r.id} />}
        <div className="formgrid">
          <label className="field full"><span>Title</span><input className="input" name="title" defaultValue={r?.title} required minLength={3} /></label>
          <label className="field"><span>Type</span><select className="select" name="type" defaultValue={type}><option value="blog">Blog post</option><option value="document">Document</option><option value="insight">Insight</option></select></label>
          <label className="field"><span>Status</span><select className="select" name="status" defaultValue={r?.status ?? "draft"}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="field"><span>URL slug</span><input className="input" name="slug" defaultValue={r?.slug} placeholder="Generated from the title" /><small>Shown at /resources/your-slug</small></label>
          <label className="field"><span>Publish date</span><input className="input" type="date" name="publishedAt" defaultValue={pub} /><small>Leave empty to use today when published.</small></label>
          <label className="field"><span>Category</span><input className="input" name="category" defaultValue={r?.category ?? ""} placeholder="Product Management · AI · ServiceNow" /></label>
          <div className="field"><span>Hero image</span><HeroPicker assets={library} name="heroImage" defaultValue={r?.heroImage ?? ""} /></div>
          <label className="field full"><span>Featured product</span><select className="select" name="productId" defaultValue={r?.productId ?? ""}><option value="">None: promote the full product suite</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><small>Sets the “Ready to see it in action?” call to action and the sidebar promo.</small></label>
          <label className="field"><span>Author name</span><input className="input" name="authorName" defaultValue={r?.authorName ?? "Kit Corry"} /></label>
          <label className="field"><span>Author title</span><input className="input" name="authorTitle" defaultValue={r?.authorTitle ?? "Founder & CEO, IC5 Labs"} /></label>
          <div className="field full"><span>Download file</span>
            {file && <div className="filerow"><a className="lnk" href={fileHref(file)}>{file.filename}</a><small>{fileLabel(file)}</small><label className="check-row"><input type="checkbox" name="removeFile" />Remove</label></div>}
            <input className="input" type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.zip,.png,.jpg,.jpeg" />
            <small>{file ? "Choose a file to replace the current one." : "For documents: visitors download this file. Up to 25 MB."} If a document has a file and no body, its card on the Resources page downloads the file directly.</small>
          </div>
          <label className="field full"><span>Summary</span><textarea className="textarea" name="summary" defaultValue={r?.summary ?? ""} style={{ minHeight: 80 }} /><small>Shown on cards and as the article lead.</small></label>
          <label className="field full"><span>Body (Markdown)</span><textarea className="textarea code" name="body" defaultValue={r?.body ?? ""} /><small>Use ## for section headings; they build the article’s table of contents.</small></label>
          <div className="field full" style={{ marginTop: -6 }}><InsertAsset assets={library} target="body" /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-violet" type="submit">Save</button><Link className="btn btn-light" href="/admin/resources">Cancel</Link></div>
      </form>
      {r && <form action={deleteResource} style={{ marginTop: 14 }}><input type="hidden" name="id" value={r.id} /><button className="btn btn-danger btn-sm" type="submit">Delete this resource</button></form>}
    </>
  );
}
