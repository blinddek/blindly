import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { AdminAccountForm } from "@/components/admin/admin-account-form";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/admin");
  }

  return <AdminAccountForm user={user} />;
}
