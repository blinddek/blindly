"use client";

import { useSyncExternalStore, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "blindly-cookie-consent";

function subscribe(callback: () => void) {
  globalThis.addEventListener("storage", callback);
  return () => globalThis.removeEventListener("storage", callback);
}

function getConsentSnapshot(): boolean {
  return !globalThis.localStorage?.getItem(CONSENT_KEY);
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Simple POPIA cookie consent banner.
 * Blocks GA4 gtag consent until accepted.
 * No complex preference manager — sufficient for SA law.
 */
export function CookieConsent() {
  const needsBanner = useSyncExternalStore(
    subscribe,
    getConsentSnapshot,
    getServerSnapshot,
  );
  const [accepted, setAccepted] = useState(false);

  function handleAccept() {
    globalThis.localStorage?.setItem(CONSENT_KEY, "accepted");
    setAccepted(true);

    // Unblock GA4 if gtag exists
    if (typeof globalThis.gtag === "function") {
      globalThis.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  }

  if (!needsBanner || accepted) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          This site uses cookies for analytics to improve your experience. By
          continuing, you accept our{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>.
        </p>
        <Button size="sm" onClick={handleAccept} className="shrink-0">
          Accept
        </Button>
      </div>
    </div>
  );
}

/** Check if cookie consent has been given */
export function hasConsent(): boolean {
  if (globalThis.localStorage === undefined) return false;
  return globalThis.localStorage.getItem(CONSENT_KEY) === "accepted";
}
