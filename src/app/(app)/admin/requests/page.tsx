import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { setRequestStatus } from "@/lib/actions/admin";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Requests" };

const TYPES = [["", "All"], ["idea", "Ideas"], ["demo", "Demo"], ["information", "Information"], ["license", "License"], ["newsletter", "Newsletter"]] as const;
const TYPE_LABEL: Record<string, string> = { idea: "Idea", demo: "Demo", information: "Information", license: "License", newsletter: "Newsletter" };
/** Readable labels for request details; internal ids are left out. */
const DETAIL_LABEL: Record<string, string> = { title: "Idea", product: "Product", kind: "Kind", impact: "Why it matters", topic: "Topic", change: "Change", release: "Release", teamSize: "Team size", interests: "Interests", plan: "Plan" };

export default async function AdminRequests({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const type = sp.type || "";
  const rows = await db.select({ r: s.requests, a: s.accounts }).from(s.requests).leftJoin(s.accounts, eq(s.accounts.id, s.requests.accountId)).orderBy(desc(s.requests.createdAt));
  const shown = type ? rows.filter((x) => x.r.type === type) : rows;
  return (
    <>
      {sp.ok && <Flash ok="Status updated." />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Requests</h1><p className="s">Demo requests, information requests, license changes, and newsletter signups.</p></div></div>
      <div className="tabsline">{TYPES.map(([k, l]) => <Link key={k} href={k ? `/admin/requests?type=${k}` : "/admin/requests"} className={type === k ? "on" : ""}>{l} · {k ? rows.filter((x) => x.r.type === k).length : rows.length}</Link>)}</div>
      <section className="panel panel-tight" style={{ marginTop: 18 }}>
        {shown.length ? <div className="tblscroll"><table className="dtable"><thead><tr><th>Received</th><th>Type</th><th>From</th><th>Details</th><th>Status</th></tr></thead><tbody>
          {shown.map(({ r, a }) => {
            const det = r.details as Record<string, unknown>;
            const order = Object.keys(DETAIL_LABEL);
            const extras = Object.entries(det).sort(([a], [b]) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99).filter(([k, v]) => !k.endsWith("Id") && !(r.type === "idea" && k === "title") && v && (!Array.isArray(v) || v.length)).map(([k, v]) => `${DETAIL_LABEL[k] ?? k}: ${Array.isArray(v) ? v.join(", ") : k === "kind" ? (v === "experience" ? "Better experience" : "New feature") : String(v)}`).join(" · ");
            return (
              <tr key={r.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.createdAt)}</td><td><b>{TYPE_LABEL[r.type] ?? r.type}</b></td>
                <td><b>{r.name ?? ""}</b><div><a className="lnk" href={`mailto:${r.email}`} style={{ display: "inline" }}>{r.email}</a></div><div className="muted" style={{ fontSize: 13 }}>{a?.name ?? r.company ?? ""}{r.role ? ` · ${r.role}` : ""}</div></td>
                <td style={{ maxWidth: 360 }}>{r.type === "idea" && det.title ? <div><b>{String(det.title)}</b></div> : null}{r.message}<div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{extras}</div></td>
                <td><form action={setRequestStatus} style={{ display: "flex", gap: 6 }}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="filterType" value={type} />
                  <select className="select" name="status" defaultValue={r.status} style={{ width: "auto", padding: "7px 32px 7px 10px" }} aria-label="Status"><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>
                  <button className="btn btn-light btn-sm" type="submit">Set</button></form></td></tr>
            );
          })}
        </tbody></table></div> : <div style={{ padding: 28 }}><div className="empty">No requests.</div></div>}
      </section>
    </>
  );
}
