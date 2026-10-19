export function money(n: number | null | undefined) {
  if (n == null) return "Contact us";
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
}
export function fmtDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { timeZone: "America/New_York", ...opts });
}
export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export function relTime(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const days = Math.round(h / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return fmtDate(d, { month: "short", day: "numeric" });
}
export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}
export const STATUS_LABEL: Record<string, string> = {
  new: "New", in_progress: "In progress", awaiting_customer: "Awaiting your reply", resolved: "Resolved", closed: "Closed",
};
export const STATUS_CLASS: Record<string, string> = {
  new: "st-new", in_progress: "st-prog", awaiting_customer: "st-wait", resolved: "st-res", closed: "st-closed",
};
export const SEVERITY: Record<number, { label: string; desc: string; target: string }> = {
  1: { label: "Severity 1", desc: "Production down, or the agent can’t process any transcript", target: "4 business hours" },
  2: { label: "Severity 2", desc: "Major function impaired with no reasonable workaround", target: "1 business day" },
  3: { label: "Severity 3", desc: "Minor function impaired, or a workaround exists", target: "3 business days" },
  4: { label: "Severity 4", desc: "Question, documentation issue, or enhancement request", target: "5 business days" },
};
