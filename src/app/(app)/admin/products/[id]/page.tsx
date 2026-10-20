import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { CopyFields } from "@/components/copy-fields";
import { saveProduct } from "@/lib/actions/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

const ERR: Record<string, string> = {
  invalid: "Add a name (2+ characters) and a short name, and choose a type.",
  slug: "Another product already uses that URL slug.",
  number: "Price and user limit must be whole numbers.",
};

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const p = isNew ? null : await db.query.products.findFirst({ where: eq(s.products.id, Number(id)) });
  if (!isNew && !p) notFound();
  const href = p ? (p.kind === "store_app" ? `/agents/${p.slug}` : `/products/${p.slug}`) : "/products/your-slug";
  return (
    <>
      <div className="crumb2"><Link href="/admin">Admin</Link> / <Link href="/admin/products">Products and agents</Link> / <b>{p?.name ?? "New product"}</b></div>
      {sp.error && <Flash err={ERR[sp.error] ?? "Couldn’t save."} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>{p ? p.name : "New product"}</h1></div>
        {p?.active && p.page && <div className="ahead-act"><Link className="btn btn-ghost2" href={href}>View live</Link></div>}</div>
      <form action={saveProduct}>
        {p && <input type="hidden" name="id" value={p.id} />}
        <section className="panel">
          <h3 className="ptitle">Details</h3>
          <div className="formgrid" style={{ marginTop: 14 }}>
            <label className="field"><span>Name</span><input className="input" name="name" defaultValue={p?.name} required minLength={2} /></label>
            <label className="field"><span>Short name</span><input className="input" name="shortName" defaultValue={p?.shortName} required maxLength={12} placeholder="CS" /></label>
            <label className="field"><span>Type</span><select className="select" name="kind" defaultValue={p?.kind ?? "app"}><option value="app">App (sold by plan)</option><option value="store_app">ServiceNow Store app</option></select><small>Store apps have their page under AI Agents.</small></label>
            <label className="field"><span>URL slug</span><input className="input" name="slug" defaultValue={p?.slug} placeholder="Generated from the name" /></label>
            <label className="field full"><span>Tagline</span><input className="input" name="tagline" defaultValue={p?.tagline ?? ""} /><small>Shown on cards that link to this product.</small></label>
            <label className="field full"><span>Description</span><textarea className="textarea" name="description" defaultValue={p?.description ?? ""} rows={3} style={{ minHeight: 0 }} /><small>Used in blog post calls to action that feature this product.</small></label>
            <label className="field"><span>Plan</span><input className="input" name="plan" defaultValue={p?.plan ?? ""} placeholder="Team, Pro, or Max" /></label>
            <label className="field"><span>Price per year per instance (USD)</span><input className="input" name="priceAnnual" defaultValue={p?.priceAnnual ?? ""} inputMode="numeric" placeholder="10000" /></label>
            <label className="field"><span>User limit</span><input className="input" name="userLimit" defaultValue={p?.userLimit ?? ""} inputMode="numeric" /><small>Leave empty for unlimited.</small></label>
            <label className="field"><span>Sort order</span><input className="input" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} /><small>Lower numbers come first.</small></label>
            <label className="field full"><span>Plan features</span><textarea className="textarea" name="features" defaultValue={(p?.features ?? []).join("\n")} rows={4} style={{ minHeight: 0 }} /><small>One per line. Shown on the pricing tiers.</small></label>
            <label className="check-row"><input type="checkbox" name="hasDocs" defaultChecked={p?.hasDocs ?? false} />Has documentation</label>
            <label className="check-row"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} />Active: shown on the site and in dropdowns</label>
          </div>
        </section>
        <CopyFields page={p?.page} href={href} />
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-violet" type="submit">Save product</button><Link className="btn btn-light" href="/admin/products">Cancel</Link></div>
      </form>
    </>
  );
}
