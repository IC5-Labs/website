import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy Policy", description: "How IC5 Labs collects, uses, discloses, and safeguards your information." };

export default function Page() {
  return <LegalPage slug="privacy" />;
}
