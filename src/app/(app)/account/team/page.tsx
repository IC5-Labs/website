import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { Flash } from "@/components/site";
import { db, schema as s } from "@/db";
import { initials, requireAccountUser } from "@/lib/users";
import { accountMembers } from "@/lib/queries";
import { inviteMember, removeMember, revokeInvite, setMemberRole } from "@/lib/actions/account";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team members" };

const ERR: Record<string, string> = {
  email: "Enter a valid email address.", already: "That person is already on your team.", other: "That email already belongs to another company account.",
  lastadmin: "Every account needs at least one account admin.", forbidden: "Only account admins can do that.", notfound: "User not found.",
};
const OK: Record<string, string> = { revoked: "Invitation revoked.", role: "Role updated.", removed: "Removed from the account." };

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user, account } = await requireAccountUser("/account/team");
  const admin = user.accountRole === "account_admin";
  const members = await accountMembers(account.id);
  const invites = await db.select().from(s.invites).where(and(eq(s.invites.accountId, account.id), eq(s.invites.status, "pending"))).orderBy(desc(s.invites.createdAt));
  const h = await headers();
  const origin = process.env.AUTH_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const just = sp.invited ? invites.find((i) => i.email === sp.invited) : null;
  return (
    <>
      {sp.error && <Flash err={ERR[sp.error] ?? "Something went wrong."} />}
      {sp.ok && <Flash ok={OK[sp.ok] ?? "Saved."} />}
      {just && (
        <div className="flash ok"><b>Invitation created for {just.email}.</b> Send them this link. They’ll sign in with that email and join {account.name} automatically.
          <div className="copybox" style={{ marginTop: 10 }}>{origin}/invite/{just.token}</div></div>
      )}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>Team members</h1><p className="s">Everyone here can see and manage {account.name}’s licenses, requests, and support cases.</p></div></div>
      {admin ? (
        <section className="panel">
          <div className="phead"><div><h2>Invite a teammate</h2><p>They’ll join {account.name} when they sign in with this email.</p></div></div>
          <form action={inviteMember} className="formgrid" style={{ gridTemplateColumns: "2fr 1fr auto", alignItems: "end" }}>
            <label className="field"><span>Email address</span><input className="input" type="email" name="email" required placeholder="teammate@company.com" /></label>
            <label className="field"><span>Role</span><select className="select" name="accountRole" defaultValue="member"><option value="member">Member</option><option value="account_admin">Account admin</option></select></label>
            <button className="btn btn-violet" type="submit">Send invite</button>
          </form>
        </section>
      ) : <div className="flash info" style={{ marginTop: 20 }}>Only account admins can invite people or change roles. Ask an account admin below.</div>}
      <section className="panel panel-tight">
        <div style={{ padding: "24px 28px 8px" }}><h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>Members · {members.length}</h2></div>
        <div className="tblscroll"><table className="dtable"><thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Last sign-in</th>{admin && <th />}</tr></thead><tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td><div className="ppl"><span className="mav sm">{initials(m)}</span><div><b>{m.name || m.email.split("@")[0]}{m.id === user.id ? " (you)" : ""}</b><small>{m.email}</small></div></div></td>
              <td><span className={`role-pill ${m.accountRole === "account_admin" ? "" : "member"}`}>{m.accountRole === "account_admin" ? "Account admin" : "Member"}</span></td>
              <td>{fmtDate(m.createdAt)}</td>
              <td>{m.lastLoginAt ? fmtDate(m.lastLoginAt) : "—"}</td>
              {admin && (
                <td><div className="actions">
                  <form action={setMemberRole}><input type="hidden" name="userId" value={m.id} /><input type="hidden" name="accountRole" value={m.accountRole === "account_admin" ? "member" : "account_admin"} /><button className="btn btn-light btn-sm" type="submit">{m.accountRole === "account_admin" ? "Make member" : "Make account admin"}</button></form>
                  {m.id !== user.id && <form action={removeMember}><input type="hidden" name="userId" value={m.id} /><button className="btn btn-danger btn-sm" type="submit">Remove</button></form>}
                </div></td>
              )}
            </tr>
          ))}
        </tbody></table></div>
      </section>
      {invites.length > 0 && (
        <section className="panel panel-tight">
          <div style={{ padding: "24px 28px 8px" }}><h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>Pending invitations · {invites.length}</h2></div>
          <div className="tblscroll"><table className="dtable"><thead><tr><th>Email</th><th>Role</th><th>Sent</th>{admin && <th>Invite link</th>}{admin && <th />}</tr></thead><tbody>
            {invites.map((i) => (
              <tr key={i.id}><td><b>{i.email}</b></td><td><span className={`role-pill ${i.accountRole === "account_admin" ? "" : "member"}`}>{i.accountRole === "account_admin" ? "Account admin" : "Member"}</span></td><td>{fmtDate(i.createdAt)}</td>
                {admin && <td><span className="mono" style={{ fontSize: 12.5, wordBreak: "break-all" }}>{origin}/invite/{i.token}</span></td>}
                {admin && <td><form action={revokeInvite}><input type="hidden" name="id" value={i.id} /><button className="btn btn-light btn-sm" type="submit">Revoke</button></form></td>}</tr>
            ))}
          </tbody></table></div>
        </section>
      )}
    </>
  );
}
