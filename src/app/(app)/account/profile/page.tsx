import { Flash } from "@/components/site";
import { requireAccountUser } from "@/lib/users";
import { updateProfile } from "@/lib/actions/account";
import { signOutAction } from "@/lib/actions/auth";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

const PROVIDER: Record<string, string> = { google: "Google", github: "GitHub", slack: "Slack", dev: "Development login" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user, account } = await requireAccountUser("/account/profile");
  return (
    <>
      {sp.ok && <Flash ok="Profile saved." />}
      {sp.error && <Flash err="Enter your name." />}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>Profile and sign-in</h1></div></div>
      <section className="panel">
        <form action={updateProfile} className="formgrid">
          <label className="field"><span>Name</span><input className="input" name="name" defaultValue={user.name ?? ""} required /></label>
          <label className="field"><span>Email</span><input className="input" value={user.email} disabled /><small>Your email comes from your sign-in provider.</small></label>
          <div className="full"><button className="btn btn-violet" type="submit">Save profile</button></div>
        </form>
      </section>
      <section className="panel">
        <div className="kv"><span>Company</span><b>{account.name}</b></div>
        <div className="kv"><span>Role</span><b>{user.accountRole === "account_admin" ? "Account admin" : "Member"}{user.role === "admin" ? " · IC5 Labs admin" : ""}</b></div>
        <div className="kv"><span>Signed in with</span><b>{PROVIDER[user.provider ?? ""] ?? user.provider ?? "—"}</b></div>
        <div className="kv"><span>Member since</span><b>{fmtDate(user.createdAt)}</b></div>
        <form action={signOutAction} style={{ marginTop: 18 }}><button className="btn btn-light" type="submit">Sign out</button></form>
      </section>
    </>
  );
}
