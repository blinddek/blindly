import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { AccountForm } from "@/components/portal/account-form";
import { getEnabledClientFields } from "@/lib/auth/client-fields";
import { isEnabled } from "@/config/features";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const enabledClientFields = getEnabledClientFields();
  const showAgreements = isEnabled("legalDocs");

  return (
    <AccountForm
      user={user}
      enabledClientFields={enabledClientFields}
      showAgreements={showAgreements}
    />
  );
}
