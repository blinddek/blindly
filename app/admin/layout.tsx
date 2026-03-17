import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect("/portal");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
