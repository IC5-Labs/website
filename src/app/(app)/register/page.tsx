import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const cb = sp.callbackUrl && sp.callbackUrl.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : "/account";
  if (await getCurrentUser()) redirect(cb);
  return (
    <div className="authbody">
      <AppHeader />
      <AuthCard mode="register" callbackUrl={cb} error={sp.error} notice={sp.notice} />
    </div>
  );
}
