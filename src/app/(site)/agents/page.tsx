import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { AgentGrid } from "@/components/catalog";
import { fragment, splitAt } from "@/lib/fragments";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Agents" };

export default async function AgentsPage() {
  const [, rest] = splitAt(fragment("agents-body"), '<section class="blk light" id="csa">');
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
