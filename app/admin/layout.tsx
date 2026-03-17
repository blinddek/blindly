import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

async function getUnreadContactCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("read", false)
    .eq("archived", false);
  return count ?? 0;
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect("/portal");
  }

  const unreadContacts = await getUnreadContactCount();

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar user={user} unreadContacts={unreadContacts} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} unreadContacts={unreadContacts} />
        <main id="main-content" className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
