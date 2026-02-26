import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: `Login | ${siteConfig.name}` };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
