import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { CaseTable } from "@/components/cases";
import { listCases, OPEN_STATUSES } from "@/lib/queries";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const count = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const n = sql<number>`count(*)::int`;
  const [openCases, urgent, accounts, users, newReqs, published] = await Promise.all([
    count(db.select({ n }).from(s.cases).where(inArray(s.cases.status, [...OPEN_STATUSES]))),
    count(db.select({ n }).from(s.cases).where(sql`${s.cases.severity} <= 2 and ${s.cases.status} in ('new','in_progress','awaiting_customer')`)),
    count(db.select({ n }).from(s.accounts)),
    count(db.select({ n }).from(s.users)),
    count(db.select({ n }).from(s.requests).where(eq(s.requests.status, "new"))),
    count(db.select({ n }).from(s.resources).where(eq(s.resources.status, "published"))),
  ]);
  const cases = (await listCases({ filter: "open" })).slice(0, 6);
  const reqs = await db.select().from(s.requests).orderBy(desc(s.requests.createdAt)).limit(6);
  return (
    <>
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>IC5 Labs console</h1><p className="s">Support, content, customers, and requests.</p></div>
        <div className="ahead-act"><Link className="btn btn-ghost2" href="/admin/docs/new">New doc page</Link><Link className="btn btn-violet" href="/admin/resources/new">+ New blog post</Link></div></div>
      <div className="kpis">
        <div className="kpi"><span className="k">OPEN CASES</span><span className="v">{openCases}</span><span className="d">{urgent ? <b className="wtag">{urgent} at Severity 1 or 2</b> : "No Sev 1 or 2 open"}</span></div>
        <div className="kpi"><span className="k">ACCOUNTS</span><span className="v">{accounts}</span><span className="d">{users} users</span></div>
        <div className="kpi"><span className="k">NEW REQUESTS</span><span className="v">{newReqs}</span><span className="d">Demos, information, newsletter</span></div>
        <div className="kpi"><span className="k">PUBLISHED</span><span className="v">{published}</span><span className="d">Blog posts, documents, insights</span></div>
      </div>
      <section className="panel"><div className="phead"><div><h2>Open cases</h2><p>Across all customers, most severe first</p></div><Link className="lnk" href="/admin/cases">All cases →</Link></div><CaseTable rows={cases} base="/admin/cases" showAccount /></section>
      <section className="panel panel-tight"><div style={{ padding: "24px 28px 8px", display: "flex", justifyContent: "space-between" }}><h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>Latest requests</h2><Link className="lnk" href="/admin/requests">All requests →</Link></div>
        {reqs.length ? <div className="tblscroll"><table className="dtable"><tbody>{reqs.map((r) => <tr key={r.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td><td><b>{r.type === "idea" ? "Idea" : r.type[0].toUpperCase() + r.type.slice(1)}</b></td><td>{r.name ?? ""} {r.email}</td><td>{r.company}</td><td>{r.status}</td></tr>)}</tbody></table></div> : <div style={{ padding: 28 }}><div className="empty">No requests yet.</div></div>}
      </section>
    </>
  );
}
