import { AppFooter } from "@/components/site";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AppFooter /></>;
}
