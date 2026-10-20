import { MarketingHeader, SiteFooter, Flash } from "@/components/site";
import { requestDemo } from "@/lib/actions/public";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book a demo" };

const INTERESTS = ["Customer Signals", "Product Model", "Release Intelligence", "AI agents and governance"];

export default async function DemoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <MarketingHeader>
        <div className="grid2" style={{ marginTop: 64, alignItems: "start", position: "relative" }}>
          <div>
            <div className="eyebrow">Book a demo</div>
            <h1 style={{ fontSize: 58 }}>See it work on <span className="grad">your own transcript.</span></h1>
            <p className="lede">A 30-minute session with the team that built Product Builder Experience. Bring a real customer conversation, or use our demo data.</p>
            <div className="agenda">
              <div><b>0–5</b><span>Your team and goals<small>How you capture customer feedback today, and where it gets lost</small></span></div>
              <div><b>5–20</b><span>Live walkthrough<small>Customer Signals Agent analyzes a transcript, then needs flow to a roadmap and a release</small></span></div>
              <div><b>20–30</b><span>Fit and next steps<small>Requirements for your instance, plan options, and a sub-production trial</small></span></div>
            </div>
          </div>
          <form className="formcard" id="form" action={requestDemo}>
            {sp.sent ? (
              <>
                <h3>Thanks, your request is in.</h3>
                <div className="s" style={{ marginBottom: 18 }}>We’ll reply within one business day to schedule your demo.</div>
                <Link className="btn" href="/resources" style={{ background: "var(--violet)", color: "#fff" }}>Read our latest insights</Link>
              </>
            ) : (
              <>
                <h3>Request your demo</h3><div className="s">We’ll reply within one business day.</div>
                {sp.error && <div style={{ marginTop: 16 }}><Flash err="Please fill in your name, work email, and company." /></div>}
                {sp.plan && <input type="hidden" name="plan" value={sp.plan} />}
                <div className="fg">
                  <label className="fld"><span className="flbl">First name</span><input className="input" name="firstName" required autoComplete="given-name" /></label>
                  <label className="fld"><span className="flbl">Last name</span><input className="input" name="lastName" required autoComplete="family-name" /></label>
                  <label className="fld full"><span className="flbl">Work email</span><input className="input" type="email" name="email" required autoComplete="email" /></label>
                  <label className="fld"><span className="flbl">Company</span><input className="input" name="company" required autoComplete="organization" /></label>
                  <label className="fld"><span className="flbl">Your role</span><select className="select" name="role" defaultValue="Product owner"><option>Product owner</option><option>Product manager</option><option>Platform owner</option><option>ServiceNow administrator</option><option>Developer or builder</option><option>Leadership</option><option>Other</option></select></label>
                  <label className="fld"><span className="flbl">ServiceNow release</span><select className="select" name="release" defaultValue="Zurich"><option>Zurich</option><option>Australia</option><option>Yokohama</option><option>Other</option></select></label>
                  <label className="fld"><span className="flbl">Team size</span><select className="select" name="teamSize" defaultValue="10–50"><option>1–9</option><option>10–50</option><option>51–200</option><option>200+</option></select></label>
                  <div className="fld full"><span className="flbl">What would you like to see?</span>
                    <div className="chks">{INTERESTS.map((i) => <label key={i} className="chk"><input type="checkbox" name="interests" value={i} defaultChecked={i === (INTERESTS.includes(sp.interest ?? "") ? sp.interest : "Customer Signals")} />{i}</label>)}</div>
                  </div>
                  <label className="fld full"><span className="flbl">Anything else we should know? (optional)</span><textarea className="textarea" name="message" style={{ minHeight: 90 }} /></label>
                </div>
                <button className="btn" type="submit">Book my demo &nbsp;→</button>
                <p className="fine">By submitting, you agree to be contacted by IC5 Labs about this request. See our <Link href="/privacy">privacy policy</Link>.</p>
              </>
            )}
          </form>
        </div>
      </MarketingHeader>
      <section className="blk dark2" style={{ padding: "70px 0" }}><div className="wrap"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 30, flexWrap: "wrap" }}>
        <div className="lbl" style={{ fontSize: 15, color: "var(--muted)", maxWidth: 340 }}>Prefer to explore on your own? Install from the ServiceNow Store with demo data on a sub-production instance.</div>
        <Link className="btn btn-ghost" href="/agents#csa">Get it on the ServiceNow Store</Link>
      </div></div></section>
      <SiteFooter />
    </>
  );
}
