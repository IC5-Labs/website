import Link from "next/link";
import { CaseTable } from "@/components/cases";
import { requireAccountUser } from "@/lib/users";
import { caseCounts, listCases } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support cases" };

export default async function CasesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { account } = await requireAccountUser("/account/cases");
  const filter = sp.filter ?? "open";
  const [rows, counts] = await Promise.all([listCases({ accountId: account.id, filter }), caseCounts(account.id)]);
  const q = sp.q?.toLowerCase().trim();
  const shown = q ? rows.filter((r) => r.subject.toLowerCase().includes(q) || r.number.toLowerCase().includes(q)) : rows;
  const chip = (f: string, label: string, n: number) => <Link className={`fchip ${filter === f ? "on" : ""}`} href={`/account/cases?filter=${f}`}>{label} · {n}</Link>;
  return (
    <>
      <div className="ahead"><div><div className="eyebrow">Support</div><h1>Support cases</h1><p className="s">Cases opened by anyone at {account.name}.</p></div><div className="ahead-act"><Link className="btn btn-violet" href="/account/cases/new">+ Open a support case</Link></div></div>
      <section className="panel">
        <div className="phead">
          <div className="filters">{chip("open", "Open", counts.open)}{chip("awaiting", "Awaiting you", counts.awaiting)}{chip("resolved", "Resolved", counts.resolved)}{chip("closed", "Closed", counts.closed)}{chip("all", "All", counts.all)}</div>
          <form action="/account/cases"><input type="hidden" name="filter" value={filter} /><input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Search cases" style={{ padding: "9px 12px", width: 220 }} aria-label="Search cases" /></form>
        </div>
        <CaseTable rows={shown} base="/account/cases" />
      </section>
    </>
  );
}
