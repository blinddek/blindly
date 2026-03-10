"use client";

import { useActionState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { subscribeNewsletter } from "@/lib/newsletter/actions";
import { isEnabled } from "@/config/features";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { FooterSection, SiteSettings } from "@/types/cms";

interface FooterProps {
  readonly sections: FooterSection[];
  readonly settings: SiteSettings;
}

export function Footer({ sections, settings }: FooterProps) {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {t(section.title)}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter — only if feature enabled */}
        {isEnabled("newsletter") && (
          <div className="mt-12 border-t border-border pt-8">
            <NewsletterForm />
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt={settings.logo_text} width={120} height={30} className="h-7 w-auto" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {settings.company_name}.{" "}
              {t({ en: "All rights reserved.", af: "Alle regte voorbehou." })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Your windows, your way. Powered by{" "}
            <a
              href="https://yoros.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Yoros
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const { t } = useLocale();
  const [state, formAction, isPending] = useActionState(
    subscribeNewsletter,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(
        t({
          en: "You're subscribed! We'll keep you in the loop.",
          af: "Jy is ingeteken! Ons sal jou op hoogte hou.",
        })
      );
      formRef.current?.reset();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h3 className="text-sm font-semibold text-foreground">
        {t({
          en: "Stay in the loop",
          af: "Bly op hoogte",
        })}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {t({
          en: "Get tips, updates, and offers — straight to your inbox.",
          af: "Kry wenke, opdaterings en aanbiedinge — reguit na jou inkassie.",
        })}
      </p>
      <form
        ref={formRef}
        action={formAction}
        className="flex w-full max-w-sm gap-2"
      >
        <input
          type="email"
          name="email"
          required
          placeholder={t({
            en: "your@email.com",
            af: "jou@epos.com",
          })}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {t({ en: "Subscribe", af: "Teken in" })}
        </button>
      </form>
    </div>
  );
}
