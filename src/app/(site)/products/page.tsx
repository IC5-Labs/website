import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { fragment } from "@/lib/fragments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function Page() {
  return (
    <>
      <MarketingHeader active="/products"><Html html={fragment("products-hero")} /></MarketingHeader>
      <Html html={fragment("products-body")} />
      <SiteFooter />
    </>
  );
}
