import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { isEnabled } from "@/config/features";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: `Register | ${siteConfig.name}` };

export default function RegisterPage() {
  if (!isEnabled("customerAuth")) {
    redirect("/login");
  }
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
