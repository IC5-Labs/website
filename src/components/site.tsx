import Link from "next/link";
import { getCurrentUser, initials, isAccountAdmin } from "@/lib/users";
import { signOutAction } from "@/lib/actions/auth";
import type { User } from "@/db/schema";

const NAV = [
  ["/products", "Products"],
  ["/agents", "AI Agents"],
  ["/how-it-works", "How it works"],
  ["/pricing", "Pricing"],
  ["/resources", "Resources"],
  ["/company", "Company"],
] as const;

export function Html({ html }: { html: string }) {
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

function UserMenu({ user, accountName }: { user: User; accountName?: string | null }) {
  return (
    <details className="usermenu">
      <summary className="me" aria-label="Account menu">
        <span className="av">{user.image ? <img src={user.image} alt="" style={{ width: 36, height: 36, borderRadius: 9 }} /> : initials(user)}</span>
        <span><b>{user.name || user.email}</b><small>{user.role === "admin" ? "IC5 Labs admin" : accountName ?? "No company account"}</small></span>
        <i>▾</i>
      </summary>
      <div className="umenu">
        <div className="uhead"><b>{user.name || user.email.split("@")[0]}</b>{user.email}</div>
        <Link href="/account">Account overview</Link>
        <Link href="/account/cases">Support cases</Link>
        <Link href="/account/licenses">Licenses</Link>
        {isAccountAdmin(user) && <Link href="/account/team">Team and invites</Link>}
        {user.role === "admin" && <Link href="/admin">Admin console</Link>}
        <form action={signOutAction}><button type="submit">Sign out</button></form>
      </div>
    </details>
  );
}

export async function SiteNav({ active }: { active?: string }) {
  const user = await getCurrentUser();
  let accountName: string | null = null;
  if (user?.accountId) {
    const { db, schema } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const a = await db.query.accounts.findFirst({ where: eq(schema.accounts.id, user.accountId), columns: { name: true } });
    accountName = a?.name ?? null;
  }
  return (
    <nav>
      <Link className="brand" href="/"><img src="/assets/logo-rev.png" alt="IC5 Labs" /></Link>
      <input type="checkbox" id="navtoggle" className="navtoggle" aria-label="Open menu" />
      <div className="links">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={active === href ? "on" : undefined}>{label}</Link>
        ))}
        {!user && <Link href="/signin" className="mobile-only">Sign in</Link>}
      </div>
      <div className="navcta">
        {user ? (
          <>
            <Link className="signin" href="/account/cases/new">Get support</Link>
            <UserMenu user={user} accountName={accountName} />
          </>
        ) : (
          <>
            <Link className="signin" href="/signin">Sign in</Link>
            <Link className="btn btn-primary" href="/demo">Book a demo</Link>
          </>
        )}
        <label htmlFor="navtoggle" className="burger" aria-label="Menu"><span /></label>
      </div>
    </nav>
  );
}

/** Dark marketing header: nav plus page hero content. */
export async function MarketingHeader({ active, home, children }: { active?: string; home?: boolean; children: React.ReactNode }) {
  return (
    <header className={home ? "hero" : "hero page"}>
      <div className="dots" />
      <div className="wrap">
        <SiteNav active={active} />
        {children}
      </div>
    </header>
  );
}

/** Compact header used by account, admin, auth and docs screens. */
export async function AppHeader({ active }: { active?: string }) {
  return (
    <header className="appbar"><div className="wrap"><SiteNav active={active} /></div></header>
  );
}

const LinkedIn = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.6h.06c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.77 2.5 4.77 5.75v5.6h-4v-4.96c0-1.18-.02-2.7-1.7-2.7-1.7 0-1.96 1.27-1.96 2.6v5.06h-4z" /></svg>
);
const YouTube = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z" /></svg>
);
export function Social() {
  return (
    <span className="social">
      <a aria-label="LinkedIn" href="https://www.linkedin.com/in/kitcorry/" target="_blank" rel="noreferrer"><LinkedIn /></a>
      <a aria-label="YouTube" href="#" ><YouTube /></a>
    </span>
  );
}

export function SiteFooter() {
  const col = (title: string, items: [string, string][]) => (
    <div className="fcol"><h6>{title}</h6>{items.map(([href, label]) => <Link key={label} href={href}>{label}</Link>)}</div>
  );
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <div className="brand"><img src="/assets/logo-rev.png" alt="IC5 Labs" /></div>
            <p className="ftag">Built by customer-focused product builders with deep ServiceNow experience in a culture of continuous care for products, people, and customers.</p>
          </div>
          {col("PRODUCTS", [["/products/customer-signals", "Customer Signals"], ["/products/product-model", "Product Model"], ["/products/release-intelligence", "Release Intelligence"], ["/agents/customer-signals-agent", "Customer Signals Agent"]])}
          {col("RESOURCES", [["/resources", "Blog"], ["/resources#insights", "State of Product insights"], ["/docs", "Documentation"], ["/pricing#support", "Service Level Agreement"]])}
          {col("COMPANY", [["/company", "About"], ["/company#leadership", "Leadership"], ["/company#partners", "Partners"], ["/company#contact", "Contact"]])}
          {col("TRUST", [["/privacy", "Privacy policy"], ["/terms", "Terms of service"]])}
        </div>
        <div className="fbot"><span>© 2026 IC5 Labs, Inc. ServiceNow is a trademark of ServiceNow, Inc. IC5 Labs is an independent ServiceNow Store partner.</span><Social /></div>
      </div>
    </footer>
  );
}

export function AppFooter() {
  return (
    <footer className="appfoot"><div className="wrap"><span>© 2026 IC5 Labs, Inc.</span><span><Link href="/docs">Documentation</Link><Link href="/pricing#support">Service level agreements</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of service</Link><Link href="/company#contact">Contact</Link></span></div></footer>
  );
}

export function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <section className="final" style={{ paddingTop: 110 }}><div className="wrap"><div className="cta-box">
      <div><h2>{title}</h2><p>{text}</p></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
        <Link className="btn btn-primary" style={{ justifyContent: "center" }} href="/demo">Book a demo &nbsp;→</Link>
        <Link className="btn btn-ghost" style={{ justifyContent: "center" }} href="/agents#csa">View on the ServiceNow Store</Link>
      </div>
    </div></div></section>
  );
}

export function Flash({ ok, err, info }: { ok?: string; err?: string; info?: string }) {
  if (!ok && !err && !info) return null;
  return <div className={`flash ${ok ? "ok" : err ? "err" : "info"}`} role="status">{ok || err || info}</div>;
}
