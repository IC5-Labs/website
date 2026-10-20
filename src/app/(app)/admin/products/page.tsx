import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { setCatalogActive } from "@/lib/actions/catalog";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products and agents admin" };

const OK: Record<string, string> = { product: "Product saved.", agent: "Agent saved.", activated: "Now shown on the site.", deactivated: "Hidden from the site." };

function Toggle({ kind, id, active }: { kind: "product" | "agent"; id: number; active: boolean }) {
  return (
    <form action={setCatalogActive}>
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(!active)} />
      <button className="btn btn-light btn-sm" type="submit">{active ? "Deactivate" : "Activate"}</button>
    </form>
  );
}
const Status = ({ active }: { active: boolean }) => <i className={`st ${active ? "st-res" : "st-closed"}`}>{active ? "Active" : "Inactive"}</i>;

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [products, agents] = await Promise.all([
    db.select().from(s.products).orderBy(asc(s.products.sortOrder)),
    db.select().from(s.agents).orderBy(asc(s.agents.sortOrder)),
  ]);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  return (
    <>
      {sp.ok && OK[sp.ok] && <Flash ok={OK[sp.ok]} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Products and agents</h1><p className="s">Inactive products and agents are hidden everywhere on the site and left out of dropdowns. Existing licenses, cases, and docs keep their links.</p></div>
        <div className="ahead-act"><Link className="btn btn-ghost2" href="/admin/products/agents/new">+ New agent</Link><Link className="btn btn-violet" href="/admin/products/new">+ New product</Link></div></div>

      <section className="panel panel-tight">
        <div className="phead"><h3 className="ptitle">Products</h3></div>
        <div className="tblscroll"><table className="dtable"><thead><tr><th>Product</th><th>Type</th><th>Plan</th><th>Price</th><th>Users</th><th>Status</th><th /></tr></thead><tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/admin/products/${p.id}`}><b>{p.name}</b></Link><div className="muted mono" style={{ fontSize: 12 }}>{p.kind === "store_app" ? `/agents/${p.slug}` : `/products/${p.slug}`}{p.kind === "store_app" ? " · agent page" : p.page ? "" : " · no detail page"}</div></td>
              <td>{p.kind === "store_app" ? "ServiceNow Store app" : "App"}</td>
              <td>{p.plan ?? "—"}</td><td>{money(p.priceAnnual)}</td><td>{p.kind === "store_app" ? "—" : p.userLimit ? `Up to ${p.userLimit}` : "Unlimited"}</td>
              <td><Status active={p.active} /></td>
              <td><div className="actions" style={{ flexWrap: "nowrap" }}>{p.active && <Link className="btn btn-light btn-sm" href={p.kind === "store_app" ? `/agents/${p.slug}` : `/products/${p.slug}`}>View</Link>}<Link className="btn btn-light btn-sm" href={`/admin/products/${p.id}`}>Edit</Link><Toggle kind="product" id={p.id} active={p.active} /></div></td>
            </tr>
          ))}
        </tbody></table></div>
      </section>

      <section className="panel panel-tight">
        <div className="phead"><h3 className="ptitle">AI agents</h3></div>
        <div className="tblscroll"><table className="dtable"><thead><tr><th>Agent</th><th>App</th><th>Included with</th><th>Store</th><th>Status</th><th /></tr></thead><tbody>
          {agents.map((a) => (
            <tr key={a.id}>
              <td><Link href={`/admin/products/agents/${a.id}`}><b>{a.name}</b></Link><div className="muted mono" style={{ fontSize: 12 }}>/agents/{a.slug}{a.page ? "" : " · no detail page"}</div></td>
              <td>{a.appName}</td>
              <td>{a.productId ? byId[a.productId]?.name ?? "—" : "—"}{a.tier ? ` · ${a.tier}` : ""}</td>
              <td>{a.live ? "Live" : "—"}</td>
              <td><Status active={a.active} /></td>
              <td><div className="actions" style={{ flexWrap: "nowrap" }}>{a.active && a.page && <Link className="btn btn-light btn-sm" href={`/agents/${a.slug}`}>View</Link>}<Link className="btn btn-light btn-sm" href={`/admin/products/agents/${a.id}`}>Edit</Link><Toggle kind="agent" id={a.id} active={a.active} /></div></td>
            </tr>
          ))}
        </tbody></table></div>
      </section>
    </>
  );
}
