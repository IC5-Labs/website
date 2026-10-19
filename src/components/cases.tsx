import Link from "next/link";
import { STATUS_CLASS, STATUS_LABEL, relTime, fmtDate } from "@/lib/format";

export type CaseRow = { number: string; subject: string; severity: number; status: string; updatedAt: Date; createdAt: Date; productName: string | null; accountName?: string | null };

export function StatusPill({ status }: { status: string }) {
  return <i className={`st ${STATUS_CLASS[status] ?? "st-new"}`}>{STATUS_LABEL[status] ?? status}</i>;
}
export function SevPill({ severity, long }: { severity: number; long?: boolean }) {
  const desc = ["", "Production down", "Major function impaired", "Minor function impaired", "Question or request"][severity];
  return <i className={`sev s${severity}`}>Sev {severity}{long ? ` · ${desc}` : ""}</i>;
}

export function CaseTable({ rows, base, showAccount }: { rows: CaseRow[]; base: string; showAccount?: boolean }) {
  if (!rows.length) return <div className="empty">No cases here yet.</div>;
  return (
    <div className="ctable">
      <div className="crow chead"><span>NUMBER</span><span>SUBJECT</span><span>SEVERITY</span><span>STATUS</span><span>UPDATED</span></div>
      {rows.map((c) => (
        <Link key={c.number} className="crow" href={`${base}/${c.number}`}>
          <span className="mono">{c.number}</span>
          <span className="subj">{c.subject}<small>{showAccount && c.accountName ? `${c.accountName} · ` : ""}{c.productName ?? "General"} · Opened {fmtDate(c.createdAt, { month: "short", day: "numeric" })}</small></span>
          <span><SevPill severity={c.severity} /></span>
          <span><StatusPill status={c.status} /></span>
          <span className="muted">{relTime(c.updatedAt)}</span>
        </Link>
      ))}
    </div>
  );
}
