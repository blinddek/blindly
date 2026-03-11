"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { StepCategory } from "./step-category";
import { StepTypeRange } from "./step-type-range";
import { StepColour } from "./step-colour";
import { StepMeasurements } from "./step-measurements";
import { StepAccessories } from "./step-accessories";
import { StepBlindQuote } from "./step-blind-quote";
import { useBlindCart } from "@/components/blinds/blind-cart-provider";
import type { SelectedExtra } from "@/types/blinds";

/* ─── Types ────────────────────────────────────────────────── */

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export interface TypeOption {
  id: string;
  name: string;
  slug: string;
  slat_size_mm: number | null;
  material: string | null;
  min_width_cm: number;
  max_width_cm: number;
  min_drop_cm: number;
  max_drop_cm: number;
  min_frame_depth_mm: number | null;
  image_url: string | null;
}

export interface RangeOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  colour_options: ColourOption[];
  starting_price_cents: number | null;
  lifestyle_image_url: string | null;
}

export interface ColourOption {
  name: string;
  hex: string;
}

export interface BlindState {
  category_id: string;
  category_slug: string;
  type_id: string;
  range_id: string;
  colour: string;
  mount_type: "inside" | "outside";
  width_mm: number;
  drop_mm: number;
  control_side: "left" | "right";
}

export interface BlindPriceResult {
  customer_price_cents: number;
  matched_width_cm: number;
  matched_drop_cm: number;
  vat_cents: number;
  total_with_vat_cents: number;
}

const INITIAL_STATE: BlindState = {
  category_id: "",
  category_slug: "",
  type_id: "",
  range_id: "",
  colour: "",
  mount_type: "inside",
  width_mm: 900,
  drop_mm: 1500,
  control_side: "left",
};

const STEP_LABELS = ["Type", "Range", "Colour", "Measurements", "Accessories", "Quote"];

/* ─── Main Component ───────────────────────────────────────── */

interface BlindConfiguratorProps {
  readonly prefill?: Partial<BlindState>;
  readonly startStep?: number;
}

export function BlindConfigurator({ prefill, startStep = 0 }: BlindConfiguratorProps) {
  const router = useRouter();
  const { addItem } = useBlindCart();

  const [step, setStep] = useState(startStep);
  const [state, setState] = useState<BlindState>({ ...INITIAL_STATE, ...prefill });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [ranges, setRanges] = useState<RangeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [quote, setQuote] = useState<BlindPriceResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/blinds/options")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Fetch types when category changes
  useEffect(() => {
    if (!state.category_id) return;
    fetch(`/api/blinds/options?category_id=${state.category_id}`)
      .then((r) => r.json())
      .then((data) => {
        setTypes(data.types ?? []);
        // Auto-select first type if only one
        if (data.types?.length === 1) {
          setState((s) => ({ ...s, type_id: data.types[0].id }));
        }
      });
  }, [state.category_id]);

  // Fetch ranges when type changes
  useEffect(() => {
    if (!state.type_id) return;
    fetch(`/api/blinds/options?type_id=${state.type_id}`)
      .then((r) => r.json())
      .then((data) => setRanges(data.ranges ?? []));
  }, [state.type_id]);

  const update = useCallback(
    (patch: Partial<BlindState>) => setState((s) => ({ ...s, ...patch })),
    []
  );

  const selectCategory = useCallback(
    (id: string, slug: string) => {
      update({
        category_id: id,
        category_slug: slug,
        type_id: "",
        range_id: "",
        colour: "",
      });
    },
    [update]
  );

  // Calculate price
  const calculatePrice = useCallback(async () => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch("/api/blinds/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blind_range_id: state.range_id,
          width_mm: state.width_mm,
          drop_mm: state.drop_mm,
          mount_type: state.mount_type,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setQuoteError(data.error);
        setQuote(null);
      } else {
        setQuote(data);
      }
    } catch {
      setQuoteError("Failed to calculate price");
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [state.range_id, state.width_mm, state.drop_mm, state.mount_type]);

  // Reset extras when measurements change (range/width/drop may affect available accessories)
  useEffect(() => {
    setSelectedExtras([]);
  }, [state.range_id, state.width_mm, state.drop_mm]);

  // Trigger price when reaching quote step
  useEffect(() => {
    if (step === 5) calculatePrice();
  }, [step, calculatePrice]);

  // Add to cart and navigate
  const handleAddToCart = useCallback(() => {
    if (!quote) return;
    const category = categories.find((c) => c.id === state.category_id);
    const type = types.find((t) => t.id === state.type_id);
    const range = ranges.find((r) => r.id === state.range_id);

    const extrasCents = selectedExtras.reduce((s, e) => s + e.price_cents, 0);
    const extrasVatCents = Math.round(extrasCents * 0.15);

    addItem({
      id: crypto.randomUUID(),
      blind_range_id: state.range_id,
      range_name: range?.name ?? "",
      category_id: state.category_id,
      category_slug: state.category_slug,
      category_name: category?.name ?? "",
      type_id: state.type_id,
      type_name: type?.name ?? "",
      colour: state.colour,
      mount_type: state.mount_type,
      width_mm: state.width_mm,
      drop_mm: state.drop_mm,
      control_side: state.control_side,
      matched_width_cm: quote.matched_width_cm,
      matched_drop_cm: quote.matched_drop_cm,
      customer_price_cents: quote.customer_price_cents,
      vat_cents: quote.vat_cents,
      total_with_vat_cents: quote.total_with_vat_cents + extrasCents + extrasVatCents,
      selected_extras: selectedExtras,
      extras_cents: extrasCents,
    });

    router.push("/cart");
  }, [quote, state, selectedExtras, categories, types, ranges, addItem, router]);

  const selectedRange = ranges.find((r) => r.id === state.range_id);

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!state.category_id;
      case 1: return !!state.type_id && !!state.range_id;
      case 2: return !!state.colour;
      case 3: return state.width_mm >= 300 && state.drop_mm >= 300;
      case 4: return true; // accessories are optional
      default: return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  const progress = ((step + 1) / STEP_LABELS.length) * 100;

  function stepLabelClass(i: number): string {
    if (i === step) return "text-xs font-semibold text-primary transition-colors";
    if (i < step) return "text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors";
    return "text-xs text-muted-foreground/50 transition-colors";
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {STEP_LABELS.length}
          </span>
          <span>{STEP_LABELS[step]}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              className={stepLabelClass(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <StepCategory
              categories={categories}
              value={state.category_id}
              onChange={selectCategory}
            />
          )}
          {step === 1 && (
            <StepTypeRange
              types={types}
              ranges={ranges}
              typeId={state.type_id}
              rangeId={state.range_id}
              categorySlug={state.category_slug}
              categoryImageUrl={categories.find((c) => c.id === state.category_id)?.image_url ?? null}
              onChangeType={(id) =>
                update({ type_id: id, range_id: "", colour: "" })
              }
              onChangeRange={(id) => update({ range_id: id, colour: "" })}
            />
          )}
          {step === 2 && selectedRange && (
            <StepColour
              colours={selectedRange.colour_options}
              rangeName={selectedRange.name}
              categorySlug={state.category_slug}
              value={state.colour}
              onChange={(c) => update({ colour: c })}
            />
          )}
          {step === 3 && (
            <StepMeasurements
              widthMm={state.width_mm}
              dropMm={state.drop_mm}
              mountType={state.mount_type}
              controlSide={state.control_side}
              onChangeWidth={(v) => update({ width_mm: v })}
              onChangeDrop={(v) => update({ drop_mm: v })}
              onChangeMountType={(v) => update({ mount_type: v })}
              onChangeControlSide={(v) => update({ control_side: v })}
              selectedType={types.find((t) => t.id === state.type_id)}
            />
          )}
          {step === 4 && (
            <StepAccessories
              blindRangeId={state.range_id}
              widthCm={Math.ceil(state.width_mm / 10)}
              dropCm={Math.ceil(state.drop_mm / 10)}
              selected={selectedExtras}
              onChange={setSelectedExtras}
            />
          )}
          {step === 5 && (
            <StepBlindQuote
              quote={quote}
              loading={quoteLoading}
              error={quoteError}
              state={state}
              categories={categories}
              types={types}
              ranges={ranges}
              selectedExtras={selectedExtras}
              onRecalculate={calculatePrice}
              onAddToCart={handleAddToCart}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {step < 5 && (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
