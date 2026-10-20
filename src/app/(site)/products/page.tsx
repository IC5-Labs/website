import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { fragment, withCatalogLinks } from "@/lib/fragments";
import { catalogState } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function Page() {
  return (
    <>
      <MarketingHeader active="/products"><Html html={fragment("products-hero")} /></MarketingHeader>
      <Html html={withCatalogLinks(fragment("products-body"), await catalogState())} />
      <SiteFooter />
    </>
  );
}
