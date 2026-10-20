import { pageToFields } from "@/lib/catalog-copy";
import type { CatalogPage } from "@/db/schema";

/** Detail page copy fields for the product and agent admin forms. */
export function CopyFields({ page, agent, href }: { page: CatalogPage | null | undefined; agent?: boolean; href: string }) {
  const v = pageToFields(page);
  const area = (name: keyof typeof v, label: string, hint?: string, rows = 3) => (
    <label className="field full"><span>{label}</span><textarea className="textarea" name={name} defaultValue={v[name]} rows={rows} style={{ minHeight: 0 }} />{hint && <small>{hint}</small>}</label>
  );
  const input = (name: keyof typeof v, label: string, hint?: string, full = false) => (
    <label className={`field${full ? " full" : ""}`}><span>{label}</span><input className="input" name={name} defaultValue={v[name]} />{hint && <small>{hint}</small>}</label>
  );
  return (
    <section className="panel">
      <h3 className="ptitle">Detail page</h3>
      <p className="s" style={{ marginBottom: 18 }}>Copy for <span className="mono">{href}</span>. Leave the headline empty to have no detail page. In lists, put one item per line; where an item has a title and a description, separate them with <span className="mono">|</span>.</p>
      <div className="formgrid">
        {input("headline", "Headline", "Shown in white, for example “Capture the voice of the”.")}
        {input("accent", "Headline accent", "Shown in the cyan gradient after the headline, for example “customer.”")}
        {area("lede", "Summary", "The paragraph under the headline.")}
        {agent && area("reads", "Reads", "What the agent works from, one per line.")}
        {agent && area("produces", "Produces", "What the agent creates, one per line.")}
        {input("problemTitle", "Problem heading", undefined, true)}
        {area("problemBody", "Problem description")}
        {input("problemQuote", "Customer quote (optional)", "Shown without quotation marks; they're added for you.", true)}
        {area("problemPoints", "Pain points", "Title | Description, one per line. Three works best.", 4)}
        {input("approachTitle", "Approach heading", undefined, true)}
        {area("approachBody", "Approach description", undefined, 4)}
        {area("before", "Before (optional)", "One per line.")}
        {area("after", "After (optional)", "One per line.")}
        {area("steps", "How it works steps (optional)", "Title | Description, one per line.", 4)}
        {area("outcomes", "Primary outcomes", "One per line.")}
        {input("capabilitiesTitle", "Capabilities heading", undefined, true)}
        {area("capabilities", "Capabilities", `Title | Description${agent ? "" : " | agent-slug"}, one per line.${agent ? "" : " Add an agent’s URL slug as a third part to link the card to that agent’s page."}`, 7)}
        {area("requirements", "System requirements (optional)", "Label | Value, one per line. Adds a Get started section with the requirements.", 4)}
      </div>
    </section>
  );
}
