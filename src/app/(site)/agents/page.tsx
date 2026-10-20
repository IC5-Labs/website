import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { AgentGrid } from "@/components/catalog";
import { fragment, removeElement, splitAt, withCatalogLinks } from "@/lib/fragments";
import { catalogState } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Agents" };

export default async function AgentsPage() {
  const catalog = await catalogState();
  let [, rest] = splitAt(fragment("agents-body"), '<section class="blk light" id="csa">');
  if (!catalog.agents.find((a) => a.slug === "customer-signals-agent")?.active) rest = removeElement(rest, '<section class="blk light" id="csa">');
  rest = withCatalogLinks(rest, catalog);
  return (
    <>
      <MarketingHeader active="/agents"><Html html={fragment("agents-hero")} /></MarketingHeader>
      <section className="blk dark2"><div className="wrap">
        <div className="eyebrow">The agents</div>
        <h2>Each one does the clerical work.<br />Your team keeps the judgment.</h2>
        <AgentGrid />
      </div></section>
      <Html html={rest} />
      <SiteFooter />
    </>
  );
}
