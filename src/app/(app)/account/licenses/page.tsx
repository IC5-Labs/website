import Link from "next/link";
import { Flash } from "@/components/site";
import { requireAccountUser } from "@/lib/users";
import { accountLicenses } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import { createAccountRequest, updateLicenseInstance } from "@/lib/actions/account";
import { getPlans } from "@/components/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Licenses" };

export default async function LicensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user, account } = await requireAccountUser("/account/licenses");
  const lics = await accountLicenses(account.id);
  const plans = await getPlans();
  const licensed = new Set(lics.map((l) => l.product.id));
  const admin = user.accountRole === "account_admin";
  return (
    <>
      {sp.ok === "instance" && <Flash ok="Instance updated." />}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>Products and licenses</h1><p className="s">Everything {account.name} is licensed to use, with terms and instances.</p></div></div>
      <section className="panel">
        {lics.length ? lics.map(({ license: l, product: p }) => (
          <div className="lic" key={l.id}>
            <div className="lictop"><div className="licname"><span className={`lmark ${p.kind === "store_app" ? "lm2" : ""}`}>{p.shortName}</span><div><h3>{p.name}</h3><span className="muted">{p.tagline}</span></div></div><i className={`st ${l.status === "active" ? "st-res" : l.status === "trial" ? "st-prog" : "st-closed"}`}>{l.status[0].toUpperCase() + l.status.slice(1)}</i></div>
            <div className="licgrid">
              <div><span className="k">Plan</span><span>{l.plan ?? "Store app"}</span></div>
              <div><span className="k">Seats</span><span>{l.seats ? `${l.seats} users` : "Unlimited"}</span></div>
              <div><span className="k">Version</span><span>{l.version ? `v${l.version}` : "—"}</span></div>
              <div><span className="k">Term</span><span>{fmtDate(l.startsAt)} to {fmtDate(l.endsAt)}</span></div>
            </div>
            {admin ? (
              <form action={updateLicenseInstance} style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <input type="hidden" name="id" value={l.id} />
                <input className="input" name="instance" defaultValue={l.instance ?? ""} placeholder="yourcompany.service-now.com" style={{ flex: "1 1 260px" }} aria-label="ServiceNow instance" />
                <button className="btn btn-light btn-sm" type="submit">Save instance</button>
              </form>
            ) : <div className="licgrid" style={{ borderTop: 0, paddingTop: 0 }}><div><span className="k">Instance</span><span className="mono">{l.instance ?? "Not set"}</span></div></div>}
            <div className="licact">
              {p.hasDocs && <Link href={`/docs/${p.slug}${l.version ? "/" + l.version : ""}`}>Documentation</Link>}
              <Link href={`/account/cases/new?product=${p.id}`}>Open a case</Link>
              <a href={`#change-${l.id}`}>Request a change</a>
            </div>
            <details id={`change-${l.id}`} style={{ marginTop: 14 }}>
              <summary className="lnk" style={{ cursor: "pointer" }}>Request a renewal, upgrade, or seat change</summary>
              <form action={createAccountRequest} style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <input type="hidden" name="type" value="license" /><input type="hidden" name="licenseId" value={l.id} /><input type="hidden" name="productId" value={p.id} /><input type="hidden" name="back" value="/account/licenses" />
                <select className="select" name="change" defaultValue="Renewal"><option>Renewal</option><option>Upgrade plan</option><option>Add seats</option><option>Change instance</option><option>Cancel</option></select>
                <textarea className="textarea" name="message" placeholder="Tell us what you need" required style={{ minHeight: 90 }} />
                <button className="btn btn-violet btn-sm" type="submit" style={{ justifySelf: "start" }}>Send request</button>
              </form>
            </details>
          </div>
        )) : <div className="empty">No licenses yet.</div>}
        <div className="upsell">
          {plans.filter((p) => !licensed.has(p.id)).slice(0, 2).map((p) => (
            <div className="up" key={p.id}><span className="lock">{(p.plan ?? "").toUpperCase()}</span><h4>{p.name}</h4><p>{p.description}</p><Link href={`/products#${p.slug}`}>Learn more →</Link></div>
          ))}
          <div className="upcta"><b>Need more?</b><span>Upgrade plans, add seats, or license a new product.</span><Link className="btn btn-violet" href="/account/requests?new=license">Talk to us</Link></div>
        </div>
      </section>
    </>
  );
}
