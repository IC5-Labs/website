import { Flash } from "@/components/site";
import { CompanyForm, CompanySummary } from "@/components/company-form";
import { requireAccountUser } from "@/lib/users";
import { updateCompany } from "@/lib/actions/account";
import { COMPANY_ERRORS } from "@/lib/company";

export const dynamic = "force-dynamic";
export const metadata = { title: "Company details" };

export default async function CompanyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user, account } = await requireAccountUser("/account/company");
  const admin = user.accountRole === "account_admin";
  return (
    <>
      {sp.ok && <Flash ok="Company details saved." />}
      {sp.error && <Flash err={COMPANY_ERRORS[sp.error] ?? (sp.error === "forbidden" ? "Only account admins can change company details." : "Couldn’t save.")} />}
      <div className="ahead"><div><div className="eyebrow">Account</div><h1>Company details</h1>
        <p className="s">{admin ? `How ${account.name} appears across your IC5 Labs account, and who we contact about billing.` : `Only account admins can change these details. Ask an account admin on the Team members page.`}</p></div></div>
      {admin ? <CompanyForm account={account} action={updateCompany} /> : <CompanySummary account={account} />}
    </>
  );
}
