"use client";

import Link from "next/link";
import { Trash2, ShoppingCart, ArrowRight, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBlindCart, type BlindCartItem } from "@/components/blinds/blind-cart-provider";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Build a /configure URL pre-filled with the same range & colour, landing on Measurements */
function sameBlindUrl(item: BlindCartItem): string {
  const params = new URLSearchParams({
    range_id: item.blind_range_id,
    colour: item.colour,
    type_id: item.type_id,
    category_id: item.category_id,
    category_slug: item.category_slug,
  });
  return `/configure?${params.toString()}`;
}

export default function CartPage() {
  const { items, removeItem, subtotalCents, vatCents, grandTotalCents } = useBlindCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <ShoppingCart className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Configure a blind to get started.
        </p>
        <Button asChild className="mt-6">
          <Link href="/configure">Configure a Blind</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items list */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item, idx) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Blind {idx + 1}
                      {item.location_label && ` — ${item.location_label}`}
                    </p>
                    <h3 className="font-semibold">{item.range_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.category_name} · {item.type_name}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Colour</dt>
                    <dd className="font-medium">{item.colour}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium">
                      {item.width_mm}mm × {item.drop_mm}mm
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Mount</dt>
                    <dd className="font-medium capitalize">{item.mount_type}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Control</dt>
                    <dd className="font-medium capitalize">{item.control_side}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Grid point</dt>
                    <dd className="font-medium">
                      {item.matched_width_cm}cm × {item.matched_drop_cm}cm
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3">
                  {/* Add same style — lands on Measurements with range & colour pre-selected */}
                  <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <Link href={sameBlindUrl(item)}>
                      <Copy className="size-3.5" />
                      Add same style
                    </Link>
                  </Button>

                  <span className="text-base font-bold">
                    {formatRand(item.total_with_vat_cents)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" asChild className="w-full">
            <Link href="/configure">
              <Plus className="size-4" />
              Add a different blind
            </Link>
          </Button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-5">
              <h2 className="mb-4 font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({items.length} blind{items.length !== 1 && "s"})
                  </span>
                  <span>{formatRand(subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (15%)</span>
                  <span>{formatRand(vatCents)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatRand(grandTotalCents)}</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Delivery fee calculated at checkout based on your location.
              </p>

              <Button asChild className="mt-5 w-full" size="lg">
                <Link href="/cart/checkout">
                  Proceed to Checkout
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
