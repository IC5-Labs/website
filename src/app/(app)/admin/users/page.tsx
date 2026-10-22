import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Flash } from "@/components/site";
import { adminDeleteUser, adminInviteUser, adminUpdateUser } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/users";
import { fmtDate } from "@/lib/format";
import { initials } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

const ERR: Record<string, string> = {
  self: "You can’t remove your own admin role.", email: "Enter a valid email.", exists: "A user with that email already exists.",
  deleteself: "You can’t delete your own account.", notfound: "That user no longer exists.",
  lastadmin: "That user is the only account admin for their company. Make someone else an account admin first.",
};

const MAIL: Record<string, string> = {
  sent: "We emailed them to let them know.",
  off: "Email isn’t set up yet, so no welcome email was sent.",
  failed: "The welcome email couldn’t be sent.",
};

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const [users, accounts] = await Promise.all([
    db.select().from(s.users).orderBy(asc(s.users.email)),
    db.select().from(s.accounts).orderBy(asc(s.accounts.name)),
  ]);
  const q = sp.q?.toLowerCase().trim();
  const shown = q ? users.filter((u) => [u.email, u.name ?? ""].some((x) => x.toLowerCase().includes(q))) : users;
  const accountOptions = <><option value="">No company account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</>;
  return (
    <>
      {sp.ok && <Flash ok={sp.ok === "created" ? `User added. ${MAIL[sp.mail ?? ""] ?? ""} They’ll get access when they first sign in with that email.` : sp.ok === "deleted" ? `Deleted ${sp.who ?? "the user"}.` : "User updated."} />}
      {sp.error && <Flash err={ERR[sp.error] ?? "Couldn’t save."} />}
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Users</h1><p className="s">Set platform roles and company membership. Admins can manage all content, cases, and users.</p></div></div>
      <section className="panel">
        <div className="phead"><div><h2>Add a user</h2><p>Pre-provision someone; they’ll sign in with Google, GitHub, or Slack using this email.</p></div></div>
        <form action={adminInviteUser} className="formgrid" style={{ gridTemplateColumns: "2fr 1.4fr 1.4fr 1fr 1fr auto", alignItems: "end" }}>
          <label className="field"><span>Email</span><input className="input" type="email" name="email" required /></label>
          <label className="field"><span>Name</span><input className="input" name="name" /></label>
          <label className="field"><span>Company account</span><select className="select" name="accountId">{accountOptions}</select></label>
          <label className="field"><span>Account role</span><select className="select" name="accountRole"><option value="member">Member</option><option value="account_admin">Account admin</option></select></label>
          <label className="field"><span>Platform role</span><select className="select" name="role"><option value="user">User</option><option value="admin">Admin</option></select></label>
          <button className="btn btn-violet" type="submit">Add</button>
        </form>
      </section>
      <section className="panel panel-tight">
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--dark)" }}>All users · {users.length}</h2>
          <form action="/admin/users"><input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Search users" style={{ padding: "9px 12px", width: 240 }} aria-label="Search users" /></form>
        </div>
        <div className="tblscroll"><table className="dtable"><thead><tr><th>User</th><th>Platform role</th><th>Company account</th><th>Account role</th><th>Last sign-in</th><th /></tr></thead><tbody>
          {shown.map((u) => (
            <tr key={u.id}>
              <td><div className="ppl"><span className="mav sm">{initials(u)}</span><div><b>{u.name || u.email.split("@")[0]}</b><small>{u.email}</small></div></div></td>
              <td colSpan={5} style={{ padding: 0 }}>
                <div className="urow">
                <form action={adminUpdateUser} style={{ display: "grid", gridTemplateColumns: "130px 1fr 150px 110px auto", gap: 10, alignItems: "center", flex: 1 }}>
                  <input type="hidden" name="id" value={u.id} />
                  <select className="select" name="role" defaultValue={u.role} aria-label="Platform role"><option value="user">User</option><option value="admin">Admin</option></select>
                  <select className="select" name="accountId" defaultValue={u.accountId ?? ""} aria-label="Company account">{accountOptions}</select>
                  <select className="select" name="accountRole" defaultValue={u.accountRole ?? "member"} aria-label="Account role"><option value="member">Member</option><option value="account_admin">Account admin</option></select>
                  <span className="muted" style={{ fontSize: 13 }}>{u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Never"}</span>
                  <button className="btn btn-light btn-sm" type="submit">Save</button>
                </form>
                {u.id !== me?.id && (
                  <details className="udel">
                    <summary className="btn btn-sm"><span className="off">Delete</span><span className="on">Cancel</span></summary>
                    <form action={adminDeleteUser} className="udel-pop">
                      <input type="hidden" name="id" value={u.id} />
                      <p><b>Delete {u.name || u.email}?</b>They lose access right away and this can’t be undone. Their cases, comments and requests stay.</p>
                      <button className="btn btn-danger btn-sm" type="submit">Delete user</button>
                    </form>
                  </details>
                )}
                </div>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      </section>
    </>
  );
}
