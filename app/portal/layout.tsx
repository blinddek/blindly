import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { isEnabled } from "@/config/features";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  if (user?.role === "admin") {
    redirect("/admin");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold">Account Setup Required</h1>
          <p className="text-muted-foreground">
            Your account is authenticated but your profile could not be loaded.
            This usually means the database migrations haven&apos;t been applied yet.
          </p>
        </div>
      </div>
    );
  }

  // Client onboarding — show minimal layout while user completes setup
  if (isEnabled("clientOnboarding")) {
    if (!user.password_changed || !user.onboarding_complete) {
      return (
        <div className="min-h-screen bg-background">
          <main id="main-content" className="p-4 md:p-8">
            {children}
          </main>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      <PortalSidebar user={user} />
      <main id="main-content" className="flex-1 overflow-y-auto pt-14 p-4 md:pt-8 md:p-8">{children}</main>
    </div>
  );
}
