import { CaseView } from "@/components/case-view";

export const dynamic = "force-dynamic";

export default async function AdminCase({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  return <CaseView number={(await params).number} mode="admin" sp={await searchParams} />;
}
