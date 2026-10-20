import { AppHeader } from "@/components/site";
import { SideNav } from "@/components/side-nav";
import { requireAdmin } from "@/lib/users";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  const items = [
    { href: "/admin", label: "Overview", icon: "◧", exact: true },
    { href: "/admin/cases", label: "Support cases", icon: "◎" },
    { href: "/admin/resources", label: "Blog and resources", icon: "≡" },
    { href: "/admin/products", label: "Products and agents", icon: "◆" },
    { href: "/admin/docs", label: "Documentation", icon: "▤" },
    { href: "/admin/accounts", label: "Accounts and licenses", icon: "▣" },
    { href: "/admin/users", label: "Users", icon: "◍" },
    { href: "/admin/requests", label: "Requests", icon: "✉" },
  ];
  return (
    <div className="appbody">
      <AppHeader />
      <main className="acct"><div className="wrap acctgrid">
        <aside className="aside">
          <div className="org"><span className="orgmark" style={{ background: "linear-gradient(135deg,#2400A7,#002FA7)" }}>IC5</span><div><b>IC5 Labs</b><small>Admin console</small></div></div>
          <SideNav items={items} />
        </aside>
        <div className="amain">{children}</div>
      </div></main>
    </div>
  );
}
