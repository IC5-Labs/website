import { CaseView } from "@/components/case-view";
import { requireAccountUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function CasePage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { number } = await params;
  await requireAccountUser(`/account/cases/${number}`);
  return <CaseView number={number} mode="account" sp={await searchParams} />;
}
