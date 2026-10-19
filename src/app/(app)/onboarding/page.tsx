import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AppHeader, Flash } from "@/components/site";
import { db, schema as s } from "@/db";
import { createCompanyAccount } from "@/lib/actions/account";
import { emailDomain, isPublicDomain, requireUser } from "@/lib/users";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your company" };

export default async function Onboarding({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("/onboarding");
  if (user.accountId) redirect("/account");
  const domain = emailDomain(user.email);
  const publicDomain = isPublicDomain(domain);
  const existing = publicDomain ? null : await db.query.accounts.findFirst({ where: eq(s.accounts.domain, domain) });
  const suggested = publicDomain ? "" : domain.split(".")[0].replace(/^\w/, (c) => c.toUpperCase());
  return (
    <div className="authbody">
      <AppHeader />
      <main className="authwrap"><div className="authgrid">
        <section className="authpanel"><div className="dots" /><div className="ap-in">
          <div className="eyebrow">Company account</div>
          <h2>{existing ? "Your company is already here." : "Set up your company on IC5 Labs."}</h2>
          <ul className="blist">
            <li>The first person from a company creates its account and becomes the account admin</li>
            <li>Account admins invite teammates by email and can make other people admins</li>
            <li>Everyone in the account sees and manages its licenses, requests, and support cases</li>
          </ul>
        </div></section>
        <section className="authcard">
          {user.role === "admin" && <Flash info="You’re an IC5 Labs admin. You can use the admin console without a company account." />}
          {existing ? (
            <>
              <h1>Ask for an invite</h1>
              <p className="s"><b>{existing.name}</b> already has an IC5 Labs account for <b>{domain}</b>. Ask one of its account admins to invite <b>{user.email}</b>. Once they do, sign in again and you’ll join automatically.</p>
              <p className="fine" style={{ marginTop: 26 }}>Need help? Email <a href="mailto:support@ic5labs.com">support@ic5labs.com</a>.</p>
            </>
          ) : (
            <form action={createCompanyAccount}>
              <h1>Create your company account</h1>
              <p className="s">Signed in as <b>{user.email}</b>. You’ll be the account admin for your company.</p>
              {sp.error === "name" && <div style={{ marginTop: 18 }}><Flash err="Enter your company name (at least 2 characters)." /></div>}
              {sp.error === "taken" && <div style={{ marginTop: 18 }}><Flash err="Your company already has an account. Ask an account admin to invite you." /></div>}
              <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
                <label className="field"><span>Company name</span><input className="input" name="name" defaultValue={suggested} required minLength={2} maxLength={120} autoFocus /></label>
                <label className="field"><span>Email domain</span><input className="input" value={publicDomain ? "Personal email (only you)" : domain} disabled />
                  <small>{publicDomain ? "Personal email addresses get a single-person account. Use your work email to let teammates join." : `Teammates with @${domain} addresses join by invitation.`}</small></label>
              </div>
              <button className="btn btn-violet" type="submit" style={{ marginTop: 24, width: "100%", justifyContent: "center" }}>Create company account</button>
              {user.role === "admin" && <p className="fine"><Link href="/admin">Go to the admin console instead</Link></p>}
            </form>
          )}
        </section>
      </div></main>
    </div>
  );
}
