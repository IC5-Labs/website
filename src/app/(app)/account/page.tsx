import Link from "next/link";
import { CaseTable } from "@/components/cases";
import { Flash } from "@/components/site";
import { requireAccountUser } from "@/lib/users";
import { accountLicenses, accountMembers, caseCounts, listCases } from "@/lib/queries";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function AccountHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user, account } = await requireAccountUser("/account");
  const [lics, members, counts, open] = await Promise.all([
    accountLicenses(account.id), accountMembers(account.id), caseCounts(account.id), listCases({ accountId: account.id, filter: "open" }),
  ]);
  const active = lics.filter((l) => l.license.status === "active" || l.license.status === "trial");
  const seats = active.reduce((n, l) => n + (l.license.seats ?? 0), 0);
  const nextRenewal = active.map((l) => l.license.endsAt).sort((a, b) => +a - +b)[0];
  const awaiting = open.filter((c) => c.status === "awaiting_customer");
  return (
    <>
      {sp.welcome && <Flash ok={`${account.name} is set up, and you’re its account admin. Invite your team from Team members.`} />}
      {sp.joined && <Flash ok={`Welcome to ${account.name}.`} />}
      <div className="ahead">
        <div><div className="eyebrow">Account</div><h1>{greeting()}, {(user.name || user.email).split(/[ @]/)[0]}</h1><p className="s">Here’s what’s happening with {account.name}’s IC5 Labs products.</p></div>
        <div className="ahead-act"><Link className="btn btn-ghost2" href="/docs">Documentation</Link><Link className="btn btn-violet" href="/account/cases/new">+ Open a support case</Link></div>
      </div>
      <div className="kpis">
        <div className="kpi"><span className="k">ACTIVE LICENSES</span><span className="v">{active.length}</span><span className="d">{active.map((l) => l.product.name).join(" · ") || "None yet"}</span></div>
        <div className="kpi"><span className="k">TEAM MEMBERS</span><span className="v">{members.length}{seats ? <small> / {seats}</small> : null}</span>{seats ? <div className="bar2"><i style={{ width: `${Math.min(100, (members.length / seats) * 100)}%` }} /></div> : <span className="d">{seats ? "" : "Seats depend on plan"}</span>}</div>
        <div className="kpi"><span className="k">OPEN CASES</span><span className="v">{counts.open}</span><span className="d">{counts.awaiting ? <b className="wtag">{counts.awaiting} awaiting your reply</b> : "Nothing waiting on you"}</span></div>
        <div className="kpi"><span className="k">RENEWAL</span><span className="v sm">{nextRenewal ? fmtDate(nextRenewal) : "—"}</span><span className="d">{active[0]?.license.plan ? `${active[0].license.plan} plan · billed annually` : "No active term"}</span></div>
      </div>
      {awaiting[0] && <div className="notice"><b>Action needed:</b> IC5 Labs replied to <Link href={`/account/cases/${awaiting[0].number}`}>{awaiting[0].number}</Link> and is waiting on you. <Link href={`/account/cases/${awaiting[0].number}`} className="nlink">View case →</Link></div>}
      <section className="panel">
        <div className="phead"><div><h2>Products and licenses</h2><p>Licensed to {account.name}</p></div><Link className="lnk" href="/account/licenses">Manage licenses →</Link></div>
        {lics.length ? lics.map(({ license: l, product: p }) => (
          <div className="lic" key={l.id}>
            <div className="lictop"><div className="licname"><span className={`lmark ${p.kind === "store_app" ? "lm2" : ""}`}>{p.shortName}</span><div><h3>{p.name}</h3><span className="muted">{p.kind === "store_app" ? "ServiceNow Store application" : "Product Builder Experience"}{l.plan ? <> · <b className="plan">{l.plan} plan</b></> : null}{l.version ? <> · <b className="plan">v{l.version}</b></> : null}</span></div></div><i className={`st ${l.status === "active" ? "st-res" : l.status === "trial" ? "st-prog" : "st-closed"}`}>{l.status[0].toUpperCase() + l.status.slice(1)}</i></div>
            <div className="licgrid">
              <div><span className="k">Instance</span><span className="mono">{l.instance ?? "Not set"}</span></div>
              <div><span className="k">Seats</span><span>{l.seats ? `${l.seats} users` : "Unlimited"}</span></div>
              <div><span className="k">Term</span><span>{fmtDate(l.startsAt)} to {fmtDate(l.endsAt)}</span></div>
              <div><span className="k">Docs</span><span>{p.hasDocs ? <Link className="lnk" href={`/docs/${p.slug}${l.version ? "/" + l.version : ""}`}>View docs</Link> : "Available at release"}</span></div>
            </div>
          </div>
        )) : <div className="empty">No licenses yet. Once IC5 Labs activates your subscription, it appears here. <Link className="lnk" href="/account/requests?new=license" style={{ display: "inline" }}>Request a license</Link></div>}
      </section>
      <section className="panel">
        <div className="phead"><div><h2>Open support cases</h2><p>Cases opened by anyone at {account.name}</p></div><Link className="lnk" href="/account/cases">All cases →</Link></div>
        <CaseTable rows={open.slice(0, 5)} base="/account/cases" />
      </section>
    </>
  );
}
