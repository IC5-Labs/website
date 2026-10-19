import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { PricingTiers } from "@/components/catalog";
import { fragment, splitAt } from "@/lib/fragments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [, rest] = splitAt(fragment("pricing-body"), '<section class="blk white">');
  return (
    <>
      <MarketingHeader active="/pricing"><Html html={fragment("pricing-hero")} /></MarketingHeader>
      <section className="blk pricing" style={{ paddingTop: 20 }}><div className="wrap">
        <PricingTiers withButtons />
        <p className="source" style={{ textAlign: "center" }}>All plans are billed annually per ServiceNow instance. Requires a licensed ServiceNow Otto product and an approved LLM provider.</p>
      </div></section>
      <div className="tblscroll-wrap"><Html html={rest} /></div>
      <SiteFooter />
    </>
  );
}
