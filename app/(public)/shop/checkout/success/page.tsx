"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { trackPurchase } from "@/lib/integrations/facebook-pixel";
import { useCart } from "@/components/shop/cart-provider";
import { siteConfig } from "@/config/site";

function getSessionValue(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const val = sessionStorage.getItem(key);
  if (val) sessionStorage.removeItem(key);
  return val;
}

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const [reference] = useState(() => getSessionValue("yt-order-ref"));
  const [email] = useState(() => getSessionValue("yt-order-email"));

  useEffect(() => {
    clearCart();
    trackPurchase({
      value: 0,
      currency: siteConfig.currency,
      content_type: "product",
    });
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center md:px-8">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        Order Confirmed!
      </h1>
      <p className="mt-4 text-muted-foreground">
        Thank you for your purchase. Your payment has been processed
        successfully.
      </p>

      {reference && (
        <p className="mt-4 text-sm text-muted-foreground">
          Reference: <span className="font-mono font-medium">{reference}</span>
        </p>
      )}

      {email && (
        <p className="mt-2 text-sm text-muted-foreground">
          A confirmation email will be sent to{" "}
          <span className="font-medium">{email}</span>.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
