import type { schema } from "@/db";
import { COMPANY_SIZES, INDUSTRIES, logoHref } from "@/lib/company";

type Account = typeof schema.accounts.$inferSelect;

/** Logo, or the company's first letter when there's no logo yet. */
export function CompanyMark({ account, size = 40 }: { account: Pick<Account, "id" | "name" | "logoUpdatedAt">; size?: number }) {
  const src = logoHref(account);
  return src
    ? <span className="orgmark logo" style={{ width: size, height: size }}><img src={src} alt={`${account.name} logo`} /></span>
    : <span className="orgmark" style={{ width: size, height: size, fontSize: size * 0.42 }}>{account.name[0]?.toUpperCase()}</span>;
}

export function CompanyForm({ account, action, hidden }: { account: Account; action: (f: FormData) => Promise<void>; hidden?: Record<string, string | number> }) {
  const personal = account.domain.startsWith("personal:");
  return (
    <form action={action} className="panel">
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="logoedit">
        <CompanyMark account={account} size={72} />
        <div className="field" style={{ flex: 1 }}><span>Logo</span>
          <input className="input" type="file" name="logo" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" />
          <small>PNG, JPG, or WebP up to 1 MB. A square image with some padding looks best.</small>
          {account.logoUpdatedAt && <label className="check-row" style={{ marginTop: 6 }}><input type="checkbox" name="removeLogo" />Remove the current logo</label>}
        </div>
      </div>
      <div className="formgrid" style={{ marginTop: 22 }}>
        <label className="field"><span>Company name</span><input className="input" name="name" defaultValue={account.name} required minLength={2} maxLength={120} /></label>
        <label className="field"><span>Website</span><input className="input" name="website" defaultValue={account.website ?? ""} placeholder="https://example.com" inputMode="url" /></label>
        <label className="field"><span>Industry</span><select className="select" name="industry" defaultValue={account.industry ?? ""}><option value="">Not set</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></label>
        <label className="field"><span>Company size</span><select className="select" name="companySize" defaultValue={account.companySize ?? ""}><option value="">Not set</option>{COMPANY_SIZES.map((c) => <option key={c} value={c}>{c} employees</option>)}</select></label>
        <label className="field"><span>Headquarters</span><input className="input" name="location" defaultValue={account.location ?? ""} placeholder="City, country" maxLength={120} /></label>
        <label className="field"><span>Main phone</span><input className="input" name="phone" defaultValue={account.phone ?? ""} placeholder="+1 555 010 0100" inputMode="tel" maxLength={40} /></label>
        <label className="field"><span>Billing contact email</span><input className="input" type="email" name="billingEmail" defaultValue={account.billingEmail ?? ""} placeholder="ap@example.com" /><small>Where IC5 Labs sends invoices and renewal notices.</small></label>
        <div className="field"><span>{personal ? "Account type" : "Email domain"}</span><div className="input ro">{personal ? "Personal account" : account.domain}</div><small>{personal ? "Set from the email you signed up with." : "People who sign in with this domain can be invited to the team. Contact support@ic5labs.com to change it."}</small></div>
      </div>
      <div style={{ marginTop: 20 }}><button className="btn btn-violet" type="submit">Save company details</button></div>
    </form>
  );
}

/** Read-only view for members who aren't account admins. */
export function CompanySummary({ account }: { account: Account }) {
  const rows: [string, string | null][] = [
    ["Website", account.website], ["Industry", account.industry], ["Company size", account.companySize ? `${account.companySize} employees` : null],
    ["Headquarters", account.location], ["Main phone", account.phone], ["Billing contact", account.billingEmail],
  ];
  return (
    <section className="panel">
      <div className="logoedit"><CompanyMark account={account} size={72} /><div><h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>{account.name}</h2></div></div>
      <dl className="cdl">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v ? (k === "Website" ? <a className="lnk" href={v} target="_blank" rel="noreferrer">{v.replace(/^https?:\/\//, "")}</a> : v) : <span className="muted">Not set</span>}</dd></div>)}
      </dl>
    </section>
  );
}
