import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { loadCaseForUser } from "@/lib/cases";
import { addCaseComment, adminUpdateCase, customerSetCaseStatus } from "@/lib/actions/cases";
import { Flash } from "@/components/site";
import { SevPill, StatusPill } from "@/components/cases";
import { fmtDate, fmtDateTime, SEVERITY, STATUS_LABEL } from "@/lib/format";
import { initials } from "@/lib/users";

function esc(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function paragraphs(t: string) {
  return t.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
}

export async function CaseView({ number, mode, sp }: { number: string; mode: "account" | "admin"; sp: Record<string, string | undefined> }) {
  const ctx = await loadCaseForUser(number);
  if (!ctx) notFound();
  const { user, c } = ctx;
  const admin = mode === "admin" && user.role === "admin";
  const [account, product, opener, assignee] = await Promise.all([
    db.query.accounts.findFirst({ where: eq(s.accounts.id, c.accountId) }),
    c.productId ? db.query.products.findFirst({ where: eq(s.products.id, c.productId) }) : null,
    c.openedById ? db.query.users.findFirst({ where: eq(s.users.id, c.openedById) }) : null,
    c.assignedToId ? db.query.users.findFirst({ where: eq(s.users.id, c.assignedToId) }) : null,
  ]);
  const comments = await db.select({ c: s.caseComments, author: s.users }).from(s.caseComments)
    .leftJoin(s.users, eq(s.users.id, s.caseComments.authorId))
    .where(eq(s.caseComments.caseId, c.id)).orderBy(asc(s.caseComments.createdAt));
  const visible = comments.filter((x) => admin || !x.c.internal);
  const people = await db.select().from(s.users).where(eq(s.users.accountId, c.accountId));
  const staff = admin ? await db.select().from(s.users).where(eq(s.users.role, "admin")) : [];
  const base = admin ? "/admin/cases" : "/account/cases";
  const responseMins = c.firstResponseAt ? Math.round((+c.firstResponseAt - +c.createdAt) / 60000) : null;
  const closed = c.status === "closed" || c.status === "resolved";

  return (
    <>
      <div className="crumb2"><Link href={admin ? "/admin" : "/account"}>{admin ? "Admin" : "Account"}</Link> / <Link href={base}>Support cases</Link> / <b>{c.number}</b></div>
      {sp.created && <Flash ok={`Case ${c.number} is open. We’ll respond within ${SEVERITY[c.severity].target.toLowerCase()}.`} />}
      {sp.ok === "reply" && <Flash ok="Reply added." />}
      {sp.ok === "updated" && <Flash ok="Case updated." />}
      {sp.ok === "close" && <Flash ok="Case closed." />}
      {sp.ok === "reopen" && <Flash ok="Case reopened." />}
      {sp.error === "empty" && <Flash err="Write a message before sending." />}
      <div className="ahead">
        <div>
          <div className="casenum mono">{c.number}</div>
          <h1 style={{ fontSize: 34 }}>{c.subject}</h1>
          <div className="tags"><SevPill severity={c.severity} long /><StatusPill status={c.status} /><span className="muted">Opened {fmtDate(c.createdAt)}{opener ? ` by ${opener.name || opener.email}` : ""}{admin && account ? ` · ${account.name}` : ""}</span></div>
        </div>
        {!admin && (
          <form className="ahead-act" action={customerSetCaseStatus}>
            <input type="hidden" name="number" value={c.number} />
            {closed ? <button className="btn btn-ghost2" name="action" value="reopen">Reopen case</button> : <button className="btn btn-ghost2" name="action" value="close">Close case</button>}
          </form>
        )}
      </div>
      <div className="casegrid">
        <div>
          <div className="thread">
            <div className="msg">
              <span className="mav">{opener ? initials(opener) : "?"}</span>
              <div className="mb"><div className="mh"><b>{opener?.name || opener?.email || "Customer"}</b><span className="role">{account?.name}</span><span className="muted">{fmtDateTime(c.createdAt)}</span></div>
                <div className="mtx" dangerouslySetInnerHTML={{ __html: paragraphs(c.description) }} /></div>
            </div>
            {visible.map(({ c: m, author }) => (
              <div key={m.id} className={`msg ${m.fromSupport ? "ic5" : ""}`} style={m.internal ? { borderStyle: "dashed", background: "#FFFBF2" } : undefined}>
                <span className="mav">{m.fromSupport ? "IC5" : author ? initials(author) : "?"}</span>
                <div className="mb"><div className="mh"><b>{author?.name || author?.email || "Former user"}</b><span className="role">{m.internal ? "Internal note" : m.fromSupport ? "IC5 Labs Support" : account?.name}</span><span className="muted">{fmtDateTime(m.createdAt)}</span></div>
                  <div className="mtx" dangerouslySetInnerHTML={{ __html: paragraphs(m.body) }} /></div>
              </div>
            ))}
          </div>
          <form className="reply" id="reply" action={addCaseComment}>
            <input type="hidden" name="number" value={c.number} />
            <div className="rtabs"><span className="on">{admin ? "Reply to customer" : "Reply to IC5 Labs"}</span></div>
            <textarea className="textarea" name="body" required placeholder="Write a reply…" style={{ border: 0, borderRadius: 0, background: "#fff", minHeight: 130 }} aria-label="Reply" />
            <div className="ract">
              {admin ? (
                <span style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <label className="check-row"><input type="checkbox" name="internal" />Internal note</label>
                  <label className="check-row">Then set status
                    <select className="select" name="status" defaultValue="awaiting_customer" style={{ width: "auto", padding: "7px 34px 7px 10px" }}>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{k === "awaiting_customer" ? "Awaiting customer" : v}</option>)}
                    </select></label>
                </span>
              ) : <span className="muted">Everyone at {account?.name} can see this case.</span>}
              <button className="btn btn-violet" type="submit">Send reply</button>
            </div>
          </form>
        </div>
        <aside className="cside">
          <div className="cbox sla"><h6>SERVICE LEVEL</h6>
            <div className={`slarow ${responseMins != null ? "ok" : ""}`}><span>Initial response target</span><b>{SEVERITY[c.severity].target}</b></div>
            <div className={`slarow ${responseMins != null ? "ok" : ""}`}><span>Initial response</span><b>{responseMins != null ? `Sent · ${Math.floor(responseMins / 60)} h ${responseMins % 60} m` : "Pending"}</b></div>
            <p>Support hours are Monday to Friday, 9am to 5pm Eastern. Severity disagreements are resolved in your favor at the first escalation.</p></div>
          {admin && (
            <form className="cbox" action={adminUpdateCase}><h6>MANAGE CASE</h6>
              <input type="hidden" name="number" value={c.number} />
              <label className="field"><span>Status</span><select className="select" name="status" defaultValue={c.status}>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{k === "awaiting_customer" ? "Awaiting customer" : v}</option>)}</select></label>
              <label className="field" style={{ marginTop: 12 }}><span>Severity</span><select className="select" name="severity" defaultValue={c.severity}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{SEVERITY[n].label}</option>)}</select></label>
              <label className="field" style={{ marginTop: 12 }}><span>Assigned to</span><select className="select" name="assignedToId" defaultValue={c.assignedToId ?? ""}><option value="">Unassigned</option>{staff.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}</select></label>
              <button className="btn btn-violet btn-sm" type="submit" style={{ marginTop: 14 }}>Save</button>
            </form>
          )}
          <div className="cbox"><h6>DETAILS</h6>
            <div className="kv"><span>Product</span><b>{product?.name ?? "General"}</b></div>
            <div className="kv"><span>Version</span><b>{c.version ? `v${c.version}` : "—"}</b></div>
            <div className="kv"><span>Instance</span><b className="mono">{c.instance ?? "—"}</b></div>
            <div className="kv"><span>Environment</span><b>{c.environment === "production" ? "Production" : "Sub-production"}</b></div>
            <div className="kv"><span>Assigned to</span><b>{assignee ? `${assignee.name || assignee.email}, IC5 Labs` : "IC5 Labs Support"}</b></div>
          </div>
          <div className="cbox"><h6>PEOPLE AT {account?.name.toUpperCase()}</h6>
            {people.map((p) => <div className="ppl" key={p.id}><span className="mav sm">{initials(p)}</span><div><b>{p.name || p.email}</b><small>{p.id === c.openedById ? "Requester" : p.accountRole === "account_admin" ? "Account admin" : "Member"}</small></div></div>)}
          </div>
          {product?.hasDocs && <div className="cbox"><h6>RELATED</h6><Link className="lnk" href={`/docs/${product.slug}${c.version ? "/" + c.version : ""}`}>{product.name} documentation</Link></div>}
        </aside>
      </div>
    </>
  );
}
