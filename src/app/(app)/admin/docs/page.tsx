import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { compareVersions } from "@/lib/content";
import { copyDocVersion, setDocVersionStatus } from "@/lib/actions/admin";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documentation admin" };

const OK: Record<string, string> = { saved: "Page saved.", deleted: "Page deleted.", status: "Version status updated.", copied: "Version copied as a draft. Edit its pages, then set it to Latest." };
const ERR: Record<string, string> = { version: "Use a version number like 1.2.", exists: "That version already exists." };

export default async function AdminDocs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const products = await db.select().from(s.products).orderBy(asc(s.products.sortOrder));
  const docs = await db.select().from(s.documentation).orderBy(asc(s.documentation.sortOrder));
  return (
    <>
      {sp.ok && <Flash ok={OK[sp.ok]} />}{sp.error && <Flash err={ERR[sp.error] ?? "Something went wrong."} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Documentation</h1><p className="s">Versioned product docs. Exactly one version per product is Latest; older versions show a banner pointing to it.</p></div>
        <div className="ahead-act"><Link className="btn btn-violet" href="/admin/docs/new">+ New page</Link></div></div>
      {products.map((p) => {
        const pd = docs.filter((d) => d.productId === p.id);
        const versions = [...new Set(pd.map((d) => d.version))].sort((a, b) => compareVersions(b, a));
        return (
          <section key={p.id} className="panel">
            <div className="phead"><div><h2>{p.name}</h2><p>{versions.length ? `${versions.length} version${versions.length > 1 ? "s" : ""}` : "No documentation yet"}</p></div><Link className="lnk" href={`/admin/docs/new?product=${p.id}`}>+ Add page</Link></div>
            {versions.map((v) => {
              const pages = pd.filter((d) => d.version === v);
              const st = pages[0].versionStatus;
              return (
                <div key={v} className="lic">
                  <div className="lictop">
                    <div className="licname"><span className="vchip lt" style={{ fontSize: 14 }}>v{v}</span><span className={`vtag ${st === "latest" ? "lt" : ""}`}>{st[0].toUpperCase() + st.slice(1)}</span></div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <form action={setDocVersionStatus} style={{ display: "flex", gap: 8 }}>
                        <input type="hidden" name="productId" value={p.id} /><input type="hidden" name="version" value={v} />
                        <select className="select" name="versionStatus" defaultValue={st} style={{ width: "auto", padding: "8px 34px 8px 10px" }} aria-label="Version status"><option value="latest">Latest</option><option value="supported">Supported</option><option value="deprecated">Deprecated</option><option value="draft">Draft (hidden)</option></select>
                        <button className="btn btn-light btn-sm" type="submit">Set</button>
                      </form>
                      <form action={copyDocVersion} style={{ display: "flex", gap: 8 }}>
                        <input type="hidden" name="productId" value={p.id} /><input type="hidden" name="from" value={v} />
                        <input className="input" name="to" placeholder="New version" style={{ width: 120, padding: "8px 10px" }} aria-label="New version number" required />
                        <button className="btn btn-light btn-sm" type="submit">Copy to new version</button>
                      </form>
                    </div>
                  </div>
                  <div className="tblscroll" style={{ marginTop: 12 }}><table className="dtable"><tbody>{pages.map((d) => (
                    <tr key={d.id}><td><b>{d.title}</b><div className="muted mono" style={{ fontSize: 12 }}>/docs/{p.slug}/{v}/{d.slug}</div></td><td>{d.section}</td><td>Updated {fmtDate(d.updatedAt)}</td>
                      <td><div className="actions"><Link className="btn btn-light btn-sm" href={`/docs/${p.slug}/${v}/${d.slug}`}>View</Link><Link className="btn btn-light btn-sm" href={`/admin/docs/${d.id}`}>Edit</Link></div></td></tr>
                  ))}</tbody></table></div>
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
