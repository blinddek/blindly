"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/shop/cart-provider";
import { formatPrice } from "@/lib/shop/format";
import { trackInitiateCheckout } from "@/lib/integrations/facebook-pixel";
import { siteConfig } from "@/config/site";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, totalItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (totalItems > 0) {
      trackInitiateCheckout({
        value: subtotalCents / 100,
        currency: siteConfig.currency,
        num_items: totalItems,
      });
    }
  }, [totalItems, subtotalCents]);

  // Redirect if cart is empty
  if (items.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add some products before checking out.
        </p>
        <Button className="mt-4" onClick={() => router.push("/shop")}>
          Browse Products
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const shipping = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address_line_1: formData.get("address_line_1") as string,
      address_line_2: formData.get("address_line_2") as string,
      city: formData.get("city") as string,
      province: formData.get("province") as string,
      postal_code: formData.get("postal_code") as string,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          shipping,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Save order ref for success page — cart cleared on success page
      sessionStorage.setItem("yt-order-ref", data.reference);
      sessionStorage.setItem("yt-order-email", shipping.email);

      // PayFast: submit hidden form to redirect to payment page
      const { payfast } = data;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payfast.action;
      for (const [key, val] of Object.entries(payfast.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = val as string;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold text-foreground">Checkout</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Contact */}
        <div>
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h2 className="text-lg font-semibold">Shipping Address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input id="address_line_1" name="address_line_1" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address_line_2">Address Line 2 (optional)</Label>
              <Input id="address_line_2" name="address_line_2" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
            <div>
              <Label htmlFor="province">Province</Label>
              <Input id="province" name="province" required />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input id="postal_code" name="postal_code" required />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="mt-3 divide-y text-sm">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between py-2"
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Shipping and tax calculated on payment.
            </p>
          </div>
        </div>

        {/* POPIA notice */}
        <p className="text-xs text-muted-foreground">
          By placing this order you agree to our{" "}
          <a href="/terms" className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          . Your personal information will be processed in accordance with POPIA.
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(subtotalCents)}`
          )}
        </Button>
      </form>
    </div>
  );
}
