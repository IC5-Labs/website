import { MarketingHeader, Html, SiteFooter } from "@/components/site";
import { fragment } from "@/lib/fragments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Company" };

export default async function Page() {
  return (
    <>
      <MarketingHeader active="/company"><Html html={fragment("company-hero")} /></MarketingHeader>
      <Html html={fragment("company-body")} />
      <SiteFooter />
    </>
  );
}
