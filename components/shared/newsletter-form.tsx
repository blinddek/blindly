"use client";

import { useActionState, useEffect, useRef } from "react";
import { subscribeNewsletter } from "@/lib/newsletter/actions";
import { useLocale } from "@/lib/locale";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable newsletter signup form with POPIA notice.
 * Can be used on any page (footer, contact, standalone).
 */
export function NewsletterForm() {
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
      <h3 className="text-lg font-semibold text-foreground">
        {t({ en: "Stay in the loop", af: "Bly op hoogte" })}
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
          placeholder={t({ en: "your@email.com", af: "jou@epos.com" })}
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
      <p className="text-xs text-muted-foreground">
        {t({
          en: "We respect your privacy. Unsubscribe anytime.",
          af: "Ons respekteer jou privaatheid. Teken enige tyd uit.",
        })}
      </p>
    </div>
  );
}
