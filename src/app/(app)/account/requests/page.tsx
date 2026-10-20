import { desc, eq } from "drizzle-orm";
import { Flash } from "@/components/site";
import { db, schema as s } from "@/db";
import { requireAccountUser } from "@/lib/users";
import { createAccountRequest } from "@/lib/actions/account";
import { fmtDate } from "@/lib/format";
import { selectableProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Requests" };

const TYPE: Record<string, string> = { demo: "Demo", information: "Information", newsletter: "Newsletter", license: "License change", idea: "Idea" };
const ST: Record<string, [string, string]> = { new: ["Received", "st-new"], contacted: ["In progress", "st-prog"], closed: ["Closed", "st-closed"] };
const IDEA_ST: Record<string, string> = { new: "Received", contacted: "Under review", closed: "Closed" };
type Details = { change?: string; topic?: string; title?: string; kind?: string; product?: string };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { account } = await requireAccountUser("/account/requests");
  const rows = await db.select({ r: s.requests, u: s.users }).from(s.requests).leftJoin(s.users, eq(s.users.id, s.requests.userId))
    .where(eq(s.requests.accountId, account.id)).orderBy(desc(s.requests.createdAt));
  const licenseFirst = sp.new === "license";
  const products = await selectableProducts();
  return (
    <>
      {sp.ok === "sent" && <Flash ok="Request sent. IC5 Labs will follow up by email." />}
      {sp.ok === "idea" && <Flash ok="Thanks for the idea. The product team reviews every one, and you can follow its status below." />}
      {sp.error === "idea" && <Flash err="Give your idea a title and describe it in a few words." />}
      {sp.error && sp.error !== "idea" && <Flash err="Add a short message so we know what you need." />}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>Requests</h1><p className="s">Questions, quotes, license changes, and ideas for {account.name}.</p></div><div className="ahead-act"><a className="btn btn-ghost2" href="#idea">Share an idea</a></div></div>
      <section className="panel">
        <div className="phead"><div><h2>New request</h2><p>For technical problems, open a support case instead.</p></div></div>
        <form action={createAccountRequest} className="formgrid">
          <label className="field"><span>Type</span><select className="select" name="type" defaultValue={licenseFirst ? "license" : "information"}><option value="information">Request for information</option><option value="license">License: new product, upgrade, renewal, or seats</option></select></label>
          <label className="field"><span>Topic</span><input className="input" name="topic" placeholder="Pricing for Pro, security questionnaire, roadmap" /></label>
          <label className="field full"><span>Message</span><textarea className="textarea" name="message" required minLength={3} style={{ minHeight: 110 }} /></label>
          <div className="full"><button className="btn btn-violet" type="submit">Send request</button></div>
        </form>
      </section>
      <section className="panel" id="idea">
        <div className="phead"><div><h2>Share an idea</h2><p>Suggest a new feature, or a better experience in something that already exists. Everyone at {account.name} can see the ideas you share.</p></div></div>
        <form action={createAccountRequest} className="formgrid">
          <input type="hidden" name="type" value="idea" />
          <label className="field full"><span>Idea</span><input className="input" name="title" required maxLength={200} placeholder="Merge duplicate customer needs in one step" autoFocus={sp.new === "idea"} /></label>
          <label className="field"><span>Product</span><select className="select" name="productId" defaultValue=""><option value="">Not sure, or more than one</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <div className="field"><span>Kind of idea</span>
            <div className="chks" style={{ marginTop: 0 }}>
              <label className="chk"><input type="radio" name="kind" value="feature" defaultChecked />New feature</label>
              <label className="chk"><input type="radio" name="kind" value="experience" />Better experience</label>
            </div>
          </div>
          <label className="field full"><span>Describe it</span><textarea className="textarea" name="message" required minLength={3} style={{ minHeight: 110 }} placeholder="What would you like to do, and what gets in the way today?" /></label>
          <label className="field full"><span>Why it matters (optional)</span><input className="input" name="impact" maxLength={500} placeholder="Who it helps, how often it comes up, what it would save" /></label>
          <div className="full"><button className="btn btn-violet" type="submit">Share idea</button></div>
        </form>
      </section>
      <section className="panel panel-tight">
        <div style={{ padding: "24px 28px 8px" }}><h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>Request history</h2></div>
        {rows.length ? (
          <div className="tblscroll"><table className="dtable"><thead><tr><th>Date</th><th>Type</th><th>Message</th><th>From</th><th>Status</th></tr></thead><tbody>
            {rows.map(({ r, u }) => (
              <tr key={r.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td><td><b>{TYPE[r.type]}</b>{(() => { const d = r.details as Details; const sub = r.type === "idea" ? [d.title, d.product, d.kind === "experience" ? "Better experience" : "New feature"].filter(Boolean).join(" · ") : d.change ?? d.topic; return sub ? <div className="muted" style={{ fontSize: 13 }}>{sub}</div> : null; })()}</td><td style={{ maxWidth: 380 }}>{r.message}</td><td>{u?.name || r.email}</td><td><i className={`st ${ST[r.status][1]}`}>{r.type === "idea" ? IDEA_ST[r.status] : ST[r.status][0]}</i></td></tr>
            ))}
          </tbody></table></div>
        ) : <div style={{ padding: 28 }}><div className="empty">No requests yet.</div></div>}
      </section>
    </>
  );
}
