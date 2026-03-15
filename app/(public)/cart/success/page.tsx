"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlindCart } from "@/components/blinds/blind-cart-provider";

export default function OrderSuccessPage() {
  const { clearCart } = useBlindCart();
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    clearCart();
    const ref = sessionStorage.getItem("blindly_order_ref");
    if (ref) {
      setReference(ref);
      sessionStorage.removeItem("blindly_order_ref");
    }
  }, [clearCart]);

  return (
    <section className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
      <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>
      <p className="mt-3 text-muted-foreground">
        Thank you for your order. We&apos;ll be in touch shortly to confirm
        production and delivery details.
      </p>

      {reference && (
        <div className="mt-6 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Order reference: </span>
          <span className="font-mono font-semibold">{reference}</span>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        A confirmation email will be sent to you once payment is verified.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/blinds">
            <ShoppingBag className="size-4" />
            Browse more blinds
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
