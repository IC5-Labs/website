import Link from "next/link";
import { CaseTable } from "@/components/cases";
import { caseCounts, listCases } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "All cases" };

export default async function AdminCases({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filter = sp.filter ?? "open";
  const [rows, counts] = await Promise.all([listCases({ filter }), caseCounts()]);
  const q = sp.q?.toLowerCase().trim();
  const shown = q ? rows.filter((r) => [r.subject, r.number, r.accountName ?? ""].some((x) => x.toLowerCase().includes(q))) : rows;
  const chip = (f: string, l: string, n: number) => <Link className={`fchip ${filter === f ? "on" : ""}`} href={`/admin/cases?filter=${f}`}>{l} · {n}</Link>;
  return (
    <>
      <div className="ahead"><div><div className="eyebrow">Admin</div><h1>Support cases</h1><p className="s">Every customer case, most severe first.</p></div></div>
      <section className="panel">
        <div className="phead"><div className="filters">{chip("open", "Open", counts.open)}{chip("awaiting", "Awaiting customer", counts.awaiting)}{chip("resolved", "Resolved", counts.resolved)}{chip("closed", "Closed", counts.closed)}{chip("all", "All", counts.all)}</div>
          <form action="/admin/cases"><input type="hidden" name="filter" value={filter} /><input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Search cases or accounts" style={{ padding: "9px 12px", width: 240 }} aria-label="Search" /></form></div>
        <CaseTable rows={shown} base="/admin/cases" showAccount />
      </section>
    </>
  );
}
