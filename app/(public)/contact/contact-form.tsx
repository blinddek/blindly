"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContactForm } from "@/lib/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Message sent! We'll get back to you soon.");
      formRef.current?.reset();
    }
  }, [state]);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold">Message Sent</h3>
        <p className="text-sm text-muted-foreground">
          Thank you for reaching out. We&apos;ll get back to you as soon as
          possible.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Honeypot — hidden from humans, filled by bots */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Your full name"
          disabled={isPending}
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          disabled={isPending}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+27 12 345 6789"
          disabled={isPending}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="enquiry">Enquiry Type</Label>
        <select
          id="enquiry"
          name="enquiry"
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a topic (optional)</option>
          <option value="Product Question">Product Question</option>
          <option value="Measurement Help">Measurement Help</option>
          <option value="Request a Quote">Request a Quote</option>
          <option value="Installation Enquiry">Installation Enquiry</option>
          <option value="Order Status">Order Status</option>
          <option value="Returns & Warranty">Returns & Warranty</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          name="message"
          required
          placeholder="How can we help?"
          rows={5}
          disabled={isPending}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        By submitting this form you agree to our{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        . We will never share your information with third parties.
      </p>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
