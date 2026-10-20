import type { CatalogPage } from "@/db/schema";

/**
 * Detail page copy is edited in the admin console as plain text: one item per line, and
 * "Title | Description" where an item has two parts. These helpers convert between that
 * text and the stored CatalogPage object.
 */
const lines = (t: FormDataEntryValue | null) => String(t ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const parts = (l: string) => l.split("|").map((x) => x.trim());
const str = (t: FormDataEntryValue | null) => String(t ?? "").trim();

export function pageFromForm(f: FormData): CatalogPage | null {
  const headline = str(f.get("headline"));
  if (!headline) return null;
  const pairs = (name: string) => lines(f.get(name)).map((l) => { const [title, ...rest] = parts(l); return { title, body: rest.join(" | ") }; });
  const list = (name: string) => lines(f.get(name));
  const optList = (name: string) => { const v = list(name); return v.length ? v : undefined; };
  const steps = pairs("steps");
  const reqs = lines(f.get("requirements")).map((l) => { const [k, ...v] = parts(l); return [k, v.join(" | ")] as [string, string]; });
  return {
    headline,
    accent: str(f.get("accent")),
    lede: str(f.get("lede")),
    reads: optList("reads"),
    produces: optList("produces"),
    problem: { title: str(f.get("problemTitle")), body: str(f.get("problemBody")), quote: str(f.get("problemQuote")) || undefined, points: pairs("problemPoints") },
    approach: {
      title: str(f.get("approachTitle")), body: str(f.get("approachBody")),
      before: optList("before"), after: optList("after"),
      steps: steps.length ? steps : undefined,
      outcomes: list("outcomes"),
    },
    capabilitiesTitle: str(f.get("capabilitiesTitle")),
    capabilities: lines(f.get("capabilities")).map((l) => {
      const [title, body = "", agent] = parts(l);
      return agent ? { title, body, agent } : { title, body };
    }),
    requirements: reqs.length ? reqs : undefined,
  };
}

/** Text for each copy field, ready to drop into the admin form. */
export function pageToFields(p: CatalogPage | null | undefined) {
  const join = (xs?: string[]) => (xs ?? []).join("\n");
  const pairs = (xs?: { title: string; body: string }[]) => (xs ?? []).map((x) => `${x.title} | ${x.body}`).join("\n");
  return {
    headline: p?.headline ?? "",
    accent: p?.accent ?? "",
    lede: p?.lede ?? "",
    reads: join(p?.reads),
    produces: join(p?.produces),
    problemTitle: p?.problem.title ?? "",
    problemBody: p?.problem.body ?? "",
    problemQuote: p?.problem.quote ?? "",
    problemPoints: pairs(p?.problem.points),
    approachTitle: p?.approach.title ?? "",
    approachBody: p?.approach.body ?? "",
    before: join(p?.approach.before),
    after: join(p?.approach.after),
    steps: pairs(p?.approach.steps),
    outcomes: join(p?.approach.outcomes),
    capabilitiesTitle: p?.capabilitiesTitle ?? "",
    capabilities: (p?.capabilities ?? []).map((c) => [c.title, c.body, c.agent].filter((x) => x !== undefined).join(" | ")).join("\n"),
    requirements: (p?.requirements ?? []).map(([k, v]) => `${k} | ${v}`).join("\n"),
  };
}
