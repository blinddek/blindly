"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingCart, ArrowRight, Plus, Copy, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBlindCart, type BlindCartItem } from "@/components/blinds/blind-cart-provider";
import {
  getDiscountRate,
  calcDiscountCents,
  type InstallationPricing,
  type VolumeDiscounts,
} from "@/types/pricing-rules";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
  const { items, hydrated, removeItem, updateLabel, subtotalCents, vatCents, grandTotalCents } = useBlindCart();
  const [discountRate, setDiscountRate] = useState(0);
  const [rulesLoaded, setRulesLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/pricing-rules")
      .then((r) => r.json())
      .then((d: { installation_pricing?: InstallationPricing; volume_discounts?: VolumeDiscounts }) => {
        if (d.volume_discounts) {
          setDiscountRate(getDiscountRate(grandTotalCents, d.volume_discounts));
        }
      })
      .finally(() => setRulesLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotalCents]);

  const discountCents = calcDiscountCents(grandTotalCents, discountRate);
  const finalTotalCents = grandTotalCents - discountCents;

  if (!hydrated) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <ShoppingCart className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20 animate-pulse" />
      </section>
    );
  }

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
                    <dt className="text-muted-foreground">Your measurements</dt>
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
                </dl>

                {item.selected_extras && item.selected_extras.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Accessories</p>
                    {item.selected_extras.map((e) => (
                      <div key={e.extra_id} className="flex justify-between text-sm">
                        <span>{e.name}</span>
                        <span className="text-muted-foreground">+ {formatRand(e.price_cents)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                    <MapPin className="size-3" />
                    Room / window location
                  </label>
                  <input
                    type="text"
                    value={item.location_label ?? ""}
                    onChange={(e) => updateLabel(item.id, e.target.value)}
                    placeholder="e.g. Kitchen, Bedroom 2, Lounge left"
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3">
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

                {rulesLoaded && discountRate > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Volume discount ({(discountRate * 100).toFixed(1)}%)</span>
                    <span>−{formatRand(discountCents)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatRand(finalTotalCents)}</span>
                </div>
              </div>

              {rulesLoaded && discountRate === 0 && grandTotalCents > 0 && grandTotalCents < 2000000 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Add {formatRand(2000000 - grandTotalCents)} more to unlock a 2.5% volume discount.
                </p>
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                Installation fee calculated at checkout based on your location.
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
