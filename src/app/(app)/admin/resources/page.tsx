import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { fmtDate } from "@/lib/format";
import { resourceHref } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resources admin" };

const TYPE: Record<string, string> = { blog: "Blog post", document: "Document", insight: "Insight" };

export default async function AdminResources({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = await db.select().from(s.resources).orderBy(desc(s.resources.updatedAt));
  const type = sp.type;
  const shown = type ? rows.filter((r) => r.type === type) : rows;
  return (
    <>
      {sp.ok === "saved" && <Flash ok="Saved." />}{sp.ok === "deleted" && <Flash ok="Deleted." />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Blog and resources</h1><p className="s">Blog posts, documents, and insights shown on the Resources page.</p></div>
        <div className="ahead-act"><Link className="btn btn-ghost2" href="/admin/resources/new?type=document">+ New document</Link><Link className="btn btn-violet" href="/admin/resources/new?type=blog">+ New blog post</Link></div></div>
      <div className="tabsline">{[["", "All"], ["blog", "Blog posts"], ["document", "Documents"], ["insight", "Insights"]].map(([k, l]) => <Link key={k} href={k ? `/admin/resources?type=${k}` : "/admin/resources"} className={(type ?? "") === k ? "on" : ""}>{l}</Link>)}</div>
      <section className="panel panel-tight" style={{ marginTop: 18 }}>
        {shown.length ? <div className="tblscroll"><table className="dtable"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Published</th><th>Updated</th><th /></tr></thead><tbody>
          {shown.map((r) => (
            <tr key={r.id}><td><Link href={`/admin/resources/${r.id}`}><b>{r.title}</b></Link><div className="muted mono" style={{ fontSize: 12 }}>{resourceHref(r)}</div></td><td>{TYPE[r.type]}</td>
              <td><i className={`st ${r.status === "published" ? "st-res" : "st-closed"}`}>{r.status === "published" ? "Published" : "Draft"}</i></td>
              <td>{fmtDate(r.publishedAt)}</td><td>{fmtDate(r.updatedAt)}</td>
              <td><div className="actions"><Link className="btn btn-light btn-sm" href={resourceHref(r)}>View</Link><Link className="btn btn-light btn-sm" href={`/admin/resources/${r.id}`}>Edit</Link></div></td></tr>
          ))}
        </tbody></table></div> : <div style={{ padding: 28 }}><div className="empty">Nothing here yet.</div></div>}
      </section>
    </>
  );
}
