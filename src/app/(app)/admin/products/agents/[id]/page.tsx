import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { CopyFields } from "@/components/copy-fields";
import { saveAgent } from "@/lib/actions/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit agent" };

const ERR: Record<string, string> = {
  invalid: "Add a name, choose an app, and write a short description (5+ characters).",
  slug: "Another agent already uses that URL slug.",
};

export default async function EditAgent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const a = isNew ? null : await db.query.agents.findFirst({ where: eq(s.agents.id, Number(id)) });
  if (!isNew && !a) notFound();
  const products = await db.select().from(s.products).orderBy(asc(s.products.sortOrder));
  const apps = products.filter((p) => p.kind === "app" && (p.active || p.name === a?.appName));
  const sellable = products.filter((p) => p.active || p.id === a?.productId);
  const href = `/agents/${a?.slug ?? "your-slug"}`;
  return (
    <>
      <div className="crumb2"><Link href="/admin">Admin</Link> / <Link href="/admin/products">Products and agents</Link> / <b>{a?.name ?? "New agent"}</b></div>
      {sp.error && <Flash err={ERR[sp.error] ?? "Couldn’t save."} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>{a ? a.name : "New agent"}</h1></div>
        {a?.active && a.page && <div className="ahead-act"><Link className="btn btn-ghost2" href={href}>View live</Link></div>}</div>
      <form action={saveAgent}>
        {a && <input type="hidden" name="id" value={a.id} />}
        <section className="panel">
          <h3 className="ptitle">Details</h3>
          <div className="formgrid" style={{ marginTop: 14 }}>
            <label className="field"><span>Name</span><input className="input" name="name" defaultValue={a?.name} required minLength={2} /></label>
            <label className="field"><span>URL slug</span><input className="input" name="slug" defaultValue={a?.slug} placeholder="Generated from the name" /></label>
            <label className="field"><span>App</span><select className="select" name="appName" defaultValue={a?.appName ?? apps[0]?.name}>{apps.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</select><small>The app this agent belongs to on the site.</small></label>
            <label className="field"><span>Included with</span><select className="select" name="productId" defaultValue={a?.productId ?? ""}><option value="">Not sold yet</option>{sellable.map((p) => <option key={p.id} value={p.id}>{p.name}{p.plan ? ` (${p.plan})` : ""}</option>)}</select><small>The plan or Store app that includes it.</small></label>
            <label className="field"><span>Plan label</span><input className="input" name="tier" defaultValue={a?.tier ?? ""} placeholder="Team, Pro, or Max" /></label>
            <label className="field"><span>Sort order</span><input className="input" name="sortOrder" type="number" defaultValue={a?.sortOrder ?? 0} /></label>
            <label className="field full"><span>Description</span><textarea className="textarea" name="description" defaultValue={a?.description} rows={3} style={{ minHeight: 0 }} required /><small>Shown on agent cards.</small></label>
            <label className="check-row"><input type="checkbox" name="live" defaultChecked={a?.live ?? false} />Live on the ServiceNow Store</label>
            <label className="check-row"><input type="checkbox" name="active" defaultChecked={a?.active ?? true} />Active: shown on the site</label>
          </div>
        </section>
        <CopyFields page={a?.page} agent href={href} />
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-violet" type="submit">Save agent</button><Link className="btn btn-light" href="/admin/products">Cancel</Link></div>
      </form>
    </>
  );
}
