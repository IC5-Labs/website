import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Terms of Service", description: "The terms that apply to the IC5 Labs website, products, and services." };

export default function Page() {
  return <LegalPage slug="terms" />;
}
