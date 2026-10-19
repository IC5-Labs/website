import { desc, eq } from "drizzle-orm";
import { Flash } from "@/components/site";
import { db, schema as s } from "@/db";
import { requireAccountUser } from "@/lib/users";
import { createAccountRequest } from "@/lib/actions/account";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Requests" };

const TYPE: Record<string, string> = { demo: "Demo", information: "Information", newsletter: "Newsletter", license: "License change" };
const ST: Record<string, [string, string]> = { new: ["Received", "st-new"], contacted: ["In progress", "st-prog"], closed: ["Closed", "st-closed"] };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { account } = await requireAccountUser("/account/requests");
  const rows = await db.select({ r: s.requests, u: s.users }).from(s.requests).leftJoin(s.users, eq(s.users.id, s.requests.userId))
    .where(eq(s.requests.accountId, account.id)).orderBy(desc(s.requests.createdAt));
  const licenseFirst = sp.new === "license";
  return (
    <>
      {sp.ok === "sent" && <Flash ok="Request sent. IC5 Labs will follow up by email." />}
      {sp.error && <Flash err="Add a short message so we know what you need." />}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>Requests</h1><p className="s">Questions, quotes, and license changes for {account.name}.</p></div></div>
      <section className="panel">
        <div className="phead"><div><h2>New request</h2><p>For technical problems, open a support case instead.</p></div></div>
        <form action={createAccountRequest} className="formgrid">
          <label className="field"><span>Type</span><select className="select" name="type" defaultValue={licenseFirst ? "license" : "information"}><option value="information">Request for information</option><option value="license">License: new product, upgrade, renewal, or seats</option></select></label>
          <label className="field"><span>Topic</span><input className="input" name="topic" placeholder="Pricing for Pro, security questionnaire, roadmap" /></label>
          <label className="field full"><span>Message</span><textarea className="textarea" name="message" required minLength={3} style={{ minHeight: 110 }} /></label>
          <div className="full"><button className="btn btn-violet" type="submit">Send request</button></div>
        </form>
      </section>
      <section className="panel panel-tight">
        <div style={{ padding: "24px 28px 8px" }}><h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>Request history</h2></div>
        {rows.length ? (
          <div className="tblscroll"><table className="dtable"><thead><tr><th>Date</th><th>Type</th><th>Message</th><th>From</th><th>Status</th></tr></thead><tbody>
            {rows.map(({ r, u }) => (
              <tr key={r.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td><td><b>{TYPE[r.type]}</b>{(r.details as { change?: string; topic?: string }).change ? <div className="muted" style={{ fontSize: 13 }}>{String((r.details as { change?: string }).change)}</div> : (r.details as { topic?: string }).topic ? <div className="muted" style={{ fontSize: 13 }}>{String((r.details as { topic?: string }).topic)}</div> : null}</td><td style={{ maxWidth: 380 }}>{r.message}</td><td>{u?.name || r.email}</td><td><i className={`st ${ST[r.status][1]}`}>{ST[r.status][0]}</i></td></tr>
            ))}
          </tbody></table></div>
        ) : <div style={{ padding: 28 }}><div className="empty">No requests yet.</div></div>}
      </section>
    </>
  );
}
