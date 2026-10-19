import Link from "next/link";
import { Flash } from "@/components/site";
import { requireAccountUser } from "@/lib/users";
import { accountLicenses, allProducts } from "@/lib/queries";
import { createCase } from "@/lib/actions/cases";
import { SEVERITY } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open a case" };

export default async function NewCase({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { account } = await requireAccountUser("/account/cases/new");
  const [lics, products] = await Promise.all([accountLicenses(account.id), allProducts()]);
  const licensedIds = new Set(lics.map((l) => l.product.id));
  const ordered = [...products.filter((p) => licensedIds.has(p.id)), ...products.filter((p) => !licensedIds.has(p.id))];
  const defaultProduct = sp.product ?? String(ordered[0]?.id ?? "");
  const instances = [...new Set(lics.map((l) => l.license.instance).filter(Boolean))] as string[];
  const defaultSev = Number(sp.severity) || 3;
  return (
    <>
      <div className="crumb2"><Link href="/account">Account</Link> / <Link href="/account/cases">Support cases</Link> / <b>New case</b></div>
      <div className="ahead"><div><div className="eyebrow">Get support</div><h1>Open a support case</h1><p className="s">Tell us what’s happening. The more detail you include, the faster we can help.</p></div></div>
      {sp.error && <div style={{ marginTop: 18 }}><Flash err="Please choose a product and severity, and add a subject (5+ characters) and description (10+ characters)." /></div>}
      <div className="casegrid">
        <form className="formpanel" action={createCase}>
          <div className="fsec"><h3><span>1</span>What is affected?</h3>
            <div className="fg">
              <label className="fld"><span className="flbl">Product</span><select className="select" name="productId" defaultValue={defaultProduct} required>{ordered.map((p) => <option key={p.id} value={p.id}>{p.name}{licensedIds.has(p.id) ? "" : " (not licensed)"}</option>)}</select></label>
              <label className="fld"><span className="flbl">Version</span><input className="input" name="version" placeholder="1.1" defaultValue={lics.find((l) => l.license.version)?.license.version ?? ""} /></label>
              <label className="fld"><span className="flbl">Instance</span><input className="input" name="instance" list="instances" placeholder="yourcompany.service-now.com" defaultValue={instances[0] ?? ""} /><datalist id="instances">{instances.map((i) => <option key={i} value={i} />)}</datalist></label>
              <div className="fld"><span className="flbl">Environment</span><div className="seg" role="radiogroup"><label><input type="radio" name="environment" value="production" defaultChecked />Production</label><label><input type="radio" name="environment" value="sub_production" />Sub-production</label></div></div>
            </div></div>
          <div className="fsec"><h3><span>2</span>How severe is it?</h3>
            <div className="sevs">{[1, 2, 3, 4].map((n) => (
              <label key={n} className="sevopt"><input type="radio" name="severity" value={n} defaultChecked={n === defaultSev} /><span><b>{SEVERITY[n].label}</b>{SEVERITY[n].desc}</span><em>{SEVERITY[n].target}</em></label>
            ))}</div>
            <p className="hint">IC5 Labs confirms severity with you. If we disagree, it’s resolved in your favor at the first escalation.</p></div>
          <div className="fsec" style={{ borderBottom: 0 }}><h3><span>3</span>Describe the issue</h3>
            <label className="fld"><span className="flbl">Subject</span><input className="input" name="subject" required minLength={5} maxLength={200} placeholder="Short summary of the problem" /></label>
            <label className="fld" style={{ marginTop: 16, display: "block" }}><span className="flbl">Description</span><textarea className="textarea" name="description" required minLength={10} placeholder="What happened, what you expected, and the steps to reproduce it. Include record numbers like CON00118 where you can." /></label>
            <div className="tipbox"><b>Tip:</b> for Analyze issues, include the most recent entry from <b>Generative AI Controller → Generative AI Logs</b>.</div>
          </div>
          <div className="fsubmit"><span className="muted">Everyone at {account.name} can see and reply to this case.</span><button className="btn btn-violet" type="submit">Submit case</button></div>
        </form>
        <aside className="cside">
          <div className="cbox"><h6>BEFORE YOU SUBMIT</h6><Link className="lnk" href="/docs">Check the documentation</Link><Link className="lnk" href="/agents#csa">Confirm system requirements</Link></div>
          <div className="cbox"><h6>SUPPORT HOURS</h6><p>Monday to Friday, 9am to 5pm Eastern, excluding US holidays.</p><p>Urgent? Call <b>(689) 210-3900</b> after submitting a Severity 1 case.</p></div>
        </aside>
      </div>
    </>
  );
}
