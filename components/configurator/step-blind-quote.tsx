"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShoppingCart, Check } from "lucide-react";
import type { SelectedExtra } from "@/types/blinds";
import type {
  BlindPriceResult,
  BlindState,
  CategoryOption,
  TypeOption,
  RangeOption,
} from "./blind-configurator";

interface Props {
  readonly quote: BlindPriceResult | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly state: BlindState;
  readonly categories: CategoryOption[];
  readonly types: TypeOption[];
  readonly ranges: RangeOption[];
  readonly selectedExtras: SelectedExtra[];
  readonly onRecalculate: () => void;
  readonly onAddToCart: () => void;
}

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function StepBlindQuote({
  quote,
  loading,
  error,
  state,
  categories,
  types,
  ranges,
  selectedExtras,
  onRecalculate,
  onAddToCart,
}: Props) {
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <p className="mt-3">Calculating your price...</p>
      </div>
    );
  }

  const category = categories.find((c) => c.id === state.category_id);
  const type = types.find((t) => t.id === state.type_id);
  const range = ranges.find((r) => r.id === state.range_id);

  if (error || !quote) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-muted-foreground">
          {error ?? "Could not calculate price. Please check your selections."}
        </p>
        <p className="text-sm text-muted-foreground">
          Price lookup requires imported supplier data. Once the admin has
          imported the supplier price sheets, pricing will work automatically.
        </p>
        <Button variant="outline" onClick={onRecalculate}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Blind Quote</h2>
        <Button variant="ghost" size="sm" onClick={onRecalculate}>
          <RefreshCw className="size-4" />
          Recalculate
        </Button>
      </div>

      {/* Configuration summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Configuration
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Category</dt>
          <dd className="font-medium">{category?.name ?? "—"}</dd>
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium">{type?.name ?? "—"}</dd>
          <dt className="text-muted-foreground">Range</dt>
          <dd className="font-medium">{range?.name ?? "—"}</dd>
          <dt className="text-muted-foreground">Colour</dt>
          <dd className="font-medium">{state.colour}</dd>
          <dt className="text-muted-foreground">Mount</dt>
          <dd className="font-medium capitalize">{state.mount_type}</dd>
          <dt className="text-muted-foreground">Your measurements</dt>
          <dd className="font-medium">
            {state.width_mm}mm × {state.drop_mm}mm
          </dd>
          <dt className="text-muted-foreground">Nearest available size</dt>
          <dd className="font-medium">
            {quote.matched_width_cm * 10}mm × {quote.matched_drop_cm * 10}mm
          </dd>
          <dt className="text-muted-foreground">Control Side</dt>
          <dd className="font-medium capitalize">{state.control_side}</dd>
        </dl>
      </div>

      {/* Price */}
      {(() => {
        const extrasCents = selectedExtras.reduce((s, e) => s + e.price_cents, 0);
        const extrasVatCents = Math.round(extrasCents * 0.15);
        const grandTotal = quote.total_with_vat_cents + extrasCents + extrasVatCents;
        return (
          <div className="divide-y rounded-lg border">
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="text-muted-foreground">Blind price (ex-VAT)</span>
              <span className="tabular-nums">{formatRand(quote.customer_price_cents)}</span>
            </div>
            {selectedExtras.map((e) => (
              <div key={e.extra_id} className="flex justify-between px-4 py-2 text-sm">
                <span className="text-muted-foreground">{e.name} (ex-VAT)</span>
                <span className="tabular-nums">+ {formatRand(e.price_cents)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="text-muted-foreground">VAT (15%)</span>
              <span className="tabular-nums">{formatRand(quote.vat_cents + extrasVatCents)}</span>
            </div>
            <div className="flex justify-between bg-primary/5 px-4 py-3">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold text-primary">{formatRand(grandTotal)}</span>
            </div>
          </div>
        );
      })()}

      <p className="text-center text-xs text-muted-foreground">
        Price is for a single blind. Add multiple blinds to your cart for
        multi-window orders.
      </p>

      {/* Add to cart */}
      <Button className="w-full" size="lg" onClick={handleAddToCart}>
        {added ? (
          <>
            <Check className="size-4" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
