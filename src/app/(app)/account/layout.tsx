import Link from "next/link";
import { AppHeader } from "@/components/site";
import { SideNav } from "@/components/side-nav";
import { requireAccountUser } from "@/lib/users";
import { fmtDate } from "@/lib/format";
import { CompanyMark } from "@/components/company-form";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, account } = await requireAccountUser("/account");
  const items = [
    { href: "/account", label: "Overview", icon: "◧", exact: true },
    { href: "/account/licenses", label: "Products and licenses", icon: "▣" },
    { href: "/account/cases", label: "Support cases", icon: "◎" },
    { href: "/account/requests", label: "Requests", icon: "✉" },
    { href: "/account/team", label: "Team members", icon: "◍" },
    { href: "/account/company", label: "Company details", icon: "▤" },
    { href: "/account/profile", label: "Profile and sign-in", icon: "◌" },
  ];
  return (
    <div className="appbody">
      <AppHeader />
      <main className="acct"><div className="wrap acctgrid">
        <aside className="aside">
          <div className="org"><CompanyMark account={account} /><div><b>{account.name}</b><small>Customer since {fmtDate(account.createdAt, { month: "short", year: "numeric" })}</small></div></div>
          <SideNav items={items} />
          {user.role === "admin" && <div style={{ marginTop: 14 }}><Link className="btn btn-light btn-sm" href="/admin">Admin console →</Link></div>}
          <div className="helpcard"><b>Need help now?</b><span>Sev 1 cases get an initial response within 4 business hours.</span><Link className="btn btn-primary" href="/account/cases/new">Open a case</Link></div>
        </aside>
        <div className="amain">{children}</div>
      </div></main>
    </div>
  );
}
