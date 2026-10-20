import Link from "next/link";
import { enabledProviders, devLoginEnabled } from "@/auth";
import { signInWith } from "@/lib/actions/auth";
import { Flash } from "@/components/site";

const LABEL: Record<string, string> = { google: "Google", github: "GitHub", slack: "Slack" };
const MARK: Record<string, string> = { google: "G", github: "GH", slack: "S" };

const ERRORS: Record<string, string> = {
  NoEmail: "Your provider didn’t share an email address. Make your email visible to the app and try again.",
  UnverifiedEmail: "Please verify your email address with your provider first.",
  OAuthAccountNotLinked: "That email is already linked to a different sign-in method.",
  AccessDenied: "Sign-in was cancelled or not allowed.",
  Configuration: "Sign-in isn’t configured correctly. Contact support@ic5labs.com.",
};

export function AuthCard({ mode, callbackUrl, error, notice }: { mode: "signin" | "register"; callbackUrl: string; error?: string; notice?: string }) {
  const signin = mode === "signin";
  const oauth = enabledProviders.filter((p) => p.id !== "dev");
  const q = callbackUrl !== "/account" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
  return (
    <main className="authwrap">
      <div className="authgrid">
        <section className="authpanel">
          <div className="dots" />
          <div className="ap-in">
            <div className="eyebrow">IC5 Labs account</div>
            <h2>Everything for your IC5 products, in one place.</h2>
            <ul className="blist"><li>See every IC5 product and plan your organization has licensed</li><li>Open and track technical support cases with IC5 Labs</li><li>Get release notes and installation guides for your versions</li></ul>
            <div className="apquote">“Support from the people who built it.”<small>Monday to Friday, 9am to 5pm Eastern · support@ic5labs.com</small></div>
          </div>
        </section>
        <section className="authcard">
          <div className="tabs"><Link href={`/signin${q}`} className={signin ? "on" : ""}>Sign in</Link><Link href={`/register${q}`} className={signin ? "" : "on"}>Create account</Link></div>
          {signin ? (
            <><h1>Welcome back</h1><p className="s">Sign in to manage licenses and support cases for your organization.</p></>
          ) : (
            <>
              <h1>Create your account</h1>
              <p className="s">Use the account you already work with. The first person from your company creates the company account; teammates join by invitation.</p>
              <div className="steps3"><div><b>1</b><span>Choose a provider</span></div><div><b>2</b><span>Create or join your company</span></div><div><b>3</b><span>Invite your team</span></div></div>
            </>
          )}
          {error && <div style={{ marginTop: 20 }}><Flash err={ERRORS[error] ?? "Sign-in failed. Please try again."} /></div>}
          {notice && <div style={{ marginTop: 20 }}><Flash info={notice} /></div>}
          <div className="oauths">
            {oauth.map((p) => (
              <form key={p.id} action={signInWith}>
                <input type="hidden" name="provider" value={p.id} />
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <button className="oauth" type="submit" style={{ width: "100%" }}><span className="pmark">{MARK[p.id] ?? p.name[0]}</span>Continue with {LABEL[p.id] ?? p.name}</button>
              </form>
            ))}
            {!oauth.length && <Flash info="Google, GitHub, and Slack sign-in will appear here once they’re configured." />}
          </div>
          {devLoginEnabled && (
            <form action={signInWith} style={{ marginTop: 18, padding: 16, border: "1.5px dashed #F4D9A6", borderRadius: 12, background: "#FFFBF2" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9A5B00", marginBottom: 10, letterSpacing: ".08em" }}>DEVELOPMENT LOGIN · DISABLED IN PRODUCTION</div>
              <input type="hidden" name="provider" value="dev" />
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <div style={{ display: "flex", gap: 8 }}><input className="input" type="email" name="email" placeholder="you@company.com" required aria-label="Email" /><button className="btn btn-violet btn-sm" type="submit">Continue</button></div>
            </form>
          )}
          <div className="or"><span>Enterprise single sign-on</span></div>
          <Link className="sso" href="/company#contact">Need SAML SSO for your organization? Contact us</Link>
          <p className="legal">By continuing, you agree to the IC5 Labs <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>. We only request your name, email address, and profile photo from your provider.</p>
          {signin ? <p className="fine">New to IC5 Labs? <Link href={`/register${q}`}>Create an account</Link></p> : <p className="fine">Already have an account? <Link href={`/signin${q}`}>Sign in</Link></p>}
        </section>
      </div>
    </main>
  );
}
