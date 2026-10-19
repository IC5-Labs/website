import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { CaseTable } from "@/components/cases";
import { accountLicenses, accountMembers, allProducts, listCases } from "@/lib/queries";
import { deleteLicense, saveLicense } from "@/lib/actions/admin";
import { initials } from "@/lib/users";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

const d10 = (d: Date) => new Date(d).toISOString().slice(0, 10);

export default async function AdminAccount({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const account = await db.query.accounts.findFirst({ where: eq(s.accounts.id, id) });
  if (!account) notFound();
  const [members, lics, products, cases] = await Promise.all([accountMembers(id), accountLicenses(id), allProducts(), listCases({ accountId: id, filter: "all" })]);
  const today = new Date(); const yearOut = new Date(today); yearOut.setFullYear(today.getFullYear() + 1);
  const LicenseForm = ({ l }: { l?: (typeof lics)[number]["license"] }) => (
    <form action={saveLicense} className="formgrid" style={{ gridTemplateColumns: "repeat(4,1fr)", alignItems: "end" }}>
      <input type="hidden" name="accountId" value={id} />{l && <input type="hidden" name="id" value={l.id} />}
      <label className="field"><span>Product</span><select className="select" name="productId" defaultValue={l?.productId}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="field"><span>Plan</span><input className="input" name="plan" defaultValue={l?.plan ?? ""} placeholder="Team" /></label>
      <label className="field"><span>Seats</span><input className="input" type="number" name="seats" defaultValue={l?.seats ?? ""} placeholder="Unlimited" /></label>
      <label className="field"><span>Status</span><select className="select" name="status" defaultValue={l?.status ?? "active"}><option value="active">Active</option><option value="trial">Trial</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select></label>
      <label className="field"><span>Instance</span><input className="input" name="instance" defaultValue={l?.instance ?? ""} placeholder="company.service-now.com" /></label>
      <label className="field"><span>Version</span><input className="input" name="version" defaultValue={l?.version ?? ""} placeholder="1.1" /></label>
      <label className="field"><span>Starts</span><input className="input" type="date" name="startsAt" defaultValue={d10(l?.startsAt ?? today)} required /></label>
      <label className="field"><span>Ends</span><input className="input" type="date" name="endsAt" defaultValue={d10(l?.endsAt ?? yearOut)} required /></label>
      <div className="full"><button className="btn btn-violet btn-sm" type="submit">{l ? "Save license" : "Add license"}</button></div>
    </form>
  );
  return (
    <>
      <div className="crumb2"><Link href="/admin">Admin</Link> / <Link href="/admin/accounts">Accounts</Link> / <b>{account.name}</b></div>
      {sp.ok && <Flash ok={sp.ok === "created" ? "Account created. Add licenses and users below." : sp.ok === "deleted" ? "License deleted." : "License saved."} />}
      {sp.error && <Flash err="Check the license fields: product, status, and both dates are required." />}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>{account.name}</h1><p className="s">{account.domain.startsWith("personal:") ? "Personal account" : account.domain} · Created {fmtDate(account.createdAt)}</p></div></div>
      <section className="panel">
        <div className="phead"><div><h2>Licenses</h2><p>What {account.name} can use</p></div></div>
        {lics.map(({ license: l, product: p }) => (
          <details key={l.id} className="lic">
            <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><b style={{ color: "var(--dark)" }}>{p.name}{l.plan ? ` · ${l.plan}` : ""}</b><span className="muted">{l.status} · {fmtDate(l.startsAt)} to {fmtDate(l.endsAt)} · {l.instance ?? "no instance"}</span></summary>
            <div style={{ marginTop: 16 }}><LicenseForm l={l} /></div>
            <form action={deleteLicense} style={{ marginTop: 10 }}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="accountId" value={id} /><button className="btn btn-danger btn-sm" type="submit">Delete license</button></form>
          </details>
        ))}
        <div className="lic"><h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--dark)", marginBottom: 14 }}>Add a license</h3><LicenseForm /></div>
      </section>
      <section className="panel">
        <div className="phead"><div><h2>Users · {members.length}</h2><p>Change roles on the Users page</p></div><Link className="lnk" href="/admin/users">Manage users →</Link></div>
        {members.map((m) => <div className="ppl" key={m.id}><span className="mav sm">{initials(m)}</span><div><b>{m.name || m.email}</b><small>{m.email} · {m.accountRole === "account_admin" ? "Account admin" : "Member"}</small></div></div>)}
        {!members.length && <div className="empty">No users yet.</div>}
      </section>
      <section className="panel"><div className="phead"><div><h2>Cases</h2></div></div><CaseTable rows={cases} base="/admin/cases" /></section>
    </>
  );
}
