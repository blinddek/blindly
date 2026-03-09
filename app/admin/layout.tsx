import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
      <main id="main-content" className="flex-1 overflow-y-auto pt-14 p-4 md:pt-8 md:p-8">{children}</main>
    </div>
  );
}
