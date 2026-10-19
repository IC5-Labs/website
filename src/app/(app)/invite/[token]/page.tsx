import Link from "next/link";
import { eq } from "drizzle-orm";
import { AppHeader, Flash } from "@/components/site";
import { db, schema as s } from "@/db";
import { acceptInvite } from "@/lib/actions/account";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Join your team" };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const sp = await searchParams;
  const invite = await db.query.invites.findFirst({ where: eq(s.invites.token, token) });
  const account = invite ? await db.query.accounts.findFirst({ where: eq(s.accounts.id, invite.accountId) }) : null;
  const user = await getCurrentUser();
  const valid = invite && invite.status === "pending" && account;
  const cb = `/invite/${token}`;
  return (
    <div className="authbody">
      <AppHeader />
      <main className="authwrap"><div className="authgrid">
        <section className="authpanel"><div className="dots" /><div className="ap-in">
          <div className="eyebrow">Team invitation</div>
          <h2>{account && (valid || user?.accountId === invite?.accountId) ? `Join ${account.name} on IC5 Labs.` : "This invitation isn’t available."}</h2>
          <ul className="blist"><li>See your company’s IC5 products and licenses</li><li>Open and follow support cases with your team</li><li>Get documentation for the versions you run</li></ul>
        </div></section>
        <section className="authcard">
          {invite && account && user && user.accountId === invite.accountId ? (
            <><h1>You’re on the team</h1><p className="s">You’ve joined <b>{account.name}</b>.</p><Link className="btn btn-violet" style={{ marginTop: 24, justifyContent: "center", width: "100%" }} href="/account">Go to your account</Link></>
          ) : !valid ? (
            <><h1>Invitation not found</h1><p className="s">It may have been revoked or already used. Ask your account admin to send a new one.</p><p className="fine"><Link href="/signin">Go to sign in</Link></p></>
          ) : !user ? (
            <>
              <h1>You’re invited</h1>
              <p className="s">This invitation is for <b>{invite!.email}</b>. Sign in or create an account with that email to join <b>{account!.name}</b>{invite!.accountRole === "account_admin" ? " as an account admin" : ""}.</p>
              <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
                <Link className="btn btn-violet" style={{ justifyContent: "center" }} href={`/register?callbackUrl=${encodeURIComponent(cb)}`}>Create account</Link>
                <Link className="btn btn-light" style={{ justifyContent: "center" }} href={`/signin?callbackUrl=${encodeURIComponent(cb)}`}>I already have an account</Link>
              </div>
            </>
          ) : user.email !== invite!.email ? (
            <><h1>Wrong account</h1><Flash err={`You’re signed in as ${user.email}, but this invitation is for ${invite!.email}. Sign out and sign in with the invited email.`} /></>
          ) : user.accountId ? (
            <><h1>Already on a team</h1><p className="s">You already belong to a company account.</p><p className="fine"><Link href="/account">Go to your account</Link></p></>
          ) : (
            <form action={acceptInvite}>
              <h1>Join {account!.name}</h1>
              {sp.error && <Flash err="We couldn’t accept this invitation. Ask your account admin for a new one." />}
              <p className="s">Signed in as <b>{user.email}</b>.</p>
              <input type="hidden" name="token" value={token} />
              <button className="btn btn-violet" style={{ marginTop: 24, width: "100%", justifyContent: "center" }} type="submit">Accept invitation</button>
            </form>
          )}
        </section>
      </div></main>
    </div>
  );
}
