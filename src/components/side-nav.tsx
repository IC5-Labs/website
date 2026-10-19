"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideNav({ items }: { items: { href: string; label: string; icon: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav className="snav">
      {items.map((i) => {
        const on = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
        return <Link key={i.href} href={i.href} className={on ? "on" : ""}><i>{i.icon}</i>{i.label}</Link>;
      })}
    </nav>
  );
}
