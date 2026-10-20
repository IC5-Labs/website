import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { PricingTiers } from "@/components/catalog";
import { fragment, splitAt, withCatalogLinks } from "@/lib/fragments";
import { catalogState } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [before, rest] = splitAt(withCatalogLinks(fragment("index-body"), await catalogState()), '<section class="blk pricing">');
  const [, after] = splitAt(rest, '<section class="final">');
  return (
    <>
      <MarketingHeader home><Html html={fragment("index-hero")} /></MarketingHeader>
      <Html html={before} />
      <section className="blk pricing"><div className="wrap">
        <div className="eyebrow">Pricing</div>
        <h2>Start with signal. Grow into the full suite.</h2>
        <PricingTiers />
      </div></section>
      <Html html={after} />
      <SiteFooter />
    </>
  );
}
