import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { fragment } from "@/lib/fragments";

export const dynamic = "force-dynamic";
export const metadata = { title: "How it works" };

export default async function Page() {
  return (
    <>
      <MarketingHeader active="/how-it-works"><Html html={fragment("how-it-works-hero")} /></MarketingHeader>
      <Html html={fragment("how-it-works-body")} />
      <SiteFooter />
    </>
  );
}
