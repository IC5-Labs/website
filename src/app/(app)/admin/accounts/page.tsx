import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { adminCreateAccount } from "@/lib/actions/admin";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accounts" };

export default async function AdminAccounts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [accounts, users, licenses, cases] = await Promise.all([
    db.select().from(s.accounts).orderBy(asc(s.accounts.name)),
    db.select({ accountId: s.users.accountId }).from(s.users),
    db.select({ accountId: s.licenses.accountId, status: s.licenses.status }).from(s.licenses),
    db.select({ accountId: s.cases.accountId, status: s.cases.status }).from(s.cases),
  ]);
  const count = <T extends { accountId: number | null }>(rows: T[], id: number, f: (r: T) => boolean = () => true) => rows.filter((r) => r.accountId === id && f(r)).length;
  return (
    <>
      {sp.error && <Flash err={sp.error === "domain" ? "An account already uses that domain." : "Enter a name and domain."} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Accounts and licenses</h1><p className="s">Customer companies, their users, and what they’re licensed to use.</p></div></div>
      <section className="panel">
        <div className="phead"><div><h2>Create an account</h2><p>Usually customers create their own on first sign-in. Use this to set one up ahead of time.</p></div></div>
        <form action={adminCreateAccount} className="formgrid" style={{ gridTemplateColumns: "2fr 2fr auto", alignItems: "end" }}>
          <label className="field"><span>Company name</span><input className="input" name="name" required /></label>
          <label className="field"><span>Email domain</span><input className="input" name="domain" placeholder="company.com" required /></label>
          <button className="btn btn-violet" type="submit">Create</button>
        </form>
      </section>
      <section className="panel panel-tight">
        {accounts.length ? <div className="tblscroll"><table className="dtable"><thead><tr><th>Company</th><th>Domain</th><th>Users</th><th>Active licenses</th><th>Open cases</th><th>Created</th><th /></tr></thead><tbody>
          {accounts.map((a) => (
            <tr key={a.id}><td><Link href={`/admin/accounts/${a.id}`}><b>{a.name}</b></Link></td><td className="mono" style={{ fontSize: 13 }}>{a.domain.startsWith("personal:") ? "Personal" : a.domain}</td>
              <td>{count(users, a.id)}</td><td>{count(licenses, a.id, (l) => l.status === "active" || l.status === "trial")}</td>
              <td>{count(cases, a.id, (c) => ["new", "in_progress", "awaiting_customer"].includes(c.status))}</td><td>{fmtDate(a.createdAt)}</td>
              <td><div className="actions"><Link className="btn btn-light btn-sm" href={`/admin/accounts/${a.id}`}>Manage</Link></div></td></tr>
          ))}
        </tbody></table></div> : <div style={{ padding: 28 }}><div className="empty">No customer accounts yet.</div></div>}
      </section>
    </>
  );
}
