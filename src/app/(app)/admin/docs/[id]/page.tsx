import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { deleteDoc, saveDoc } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit doc page" };

export default async function EditDoc({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const d = isNew ? null : await db.query.documentation.findFirst({ where: eq(s.documentation.id, Number(id)) });
  if (!isNew && !d) notFound();
  const products = await db.select().from(s.products).orderBy(asc(s.products.sortOrder));
  const product = d?.productId ?? (Number(sp.product) || products.find((p) => p.hasDocs)?.id);
  return (
    <>
      <div className="crumb2"><Link href="/admin">Admin</Link> / <Link href="/admin/docs">Documentation</Link> / <b>{isNew ? "New page" : d!.title}</b></div>
      {sp.error === "invalid" && <Flash err="Check the fields: product, version like 1.2, title, section, and body are required." />}
      {sp.error === "slug" && <Flash err="That product version already has a page with this slug." />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>{isNew ? "New documentation page" : "Edit documentation page"}</h1></div></div>
      <form action={saveDoc} className="panel">
        {d && <input type="hidden" name="id" value={d.id} />}
        <div className="formgrid">
          <label className="field"><span>Product</span><select className="select" name="productId" defaultValue={product}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="field"><span>Version</span><input className="input" name="version" defaultValue={d?.version ?? ""} placeholder="1.2" required /></label>
          <label className="field"><span>Version status</span><select className="select" name="versionStatus" defaultValue={d?.versionStatus ?? "draft"}><option value="latest">Latest</option><option value="supported">Supported</option><option value="deprecated">Deprecated</option><option value="draft">Draft (hidden)</option></select><small>Applies to every page in this version.</small></label>
          <label className="field"><span>Navigation section</span><input className="input" name="section" defaultValue={d?.section ?? "Install and configure"} required /></label>
          <label className="field"><span>Title</span><input className="input" name="title" defaultValue={d?.title} required /></label>
          <label className="field"><span>URL slug</span><input className="input" name="slug" defaultValue={d?.slug ?? ""} placeholder="Generated from the title" /></label>
          <label className="field"><span>Order</span><input className="input" type="number" name="sortOrder" defaultValue={d?.sortOrder ?? 0} /></label>
          <label className="field full"><span>Summary</span><input className="input" name="summary" defaultValue={d?.summary ?? ""} /></label>
          <label className="field full"><span>Body (Markdown)</span><textarea className="textarea code" name="body" defaultValue={d?.body ?? ""} required /><small># headings become sections in the navigation; ## headings appear in “On this page”.</small></label>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-violet" type="submit">Save page</button><Link className="btn btn-light" href="/admin/docs">Cancel</Link></div>
      </form>
      {d && <form action={deleteDoc} style={{ marginTop: 14 }}><input type="hidden" name="id" value={d.id} /><button className="btn btn-danger btn-sm" type="submit">Delete this page</button></form>}
    </>
  );
}
