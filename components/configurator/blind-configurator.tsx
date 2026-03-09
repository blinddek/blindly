"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { StepCategory } from "./step-category";
import { StepTypeRange } from "./step-type-range";
import { StepColour } from "./step-colour";
import { StepMeasurements } from "./step-measurements";
import { StepBlindQuote } from "./step-blind-quote";

/* ─── Types ────────────────────────────────────────────────── */

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
}

export interface RangeOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  colour_options: ColourOption[];
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

const STEP_LABELS = ["Type", "Range", "Colour", "Measurements", "Quote"];

/* ─── Main Component ───────────────────────────────────────── */

interface BlindConfiguratorProps {
  prefill?: Partial<BlindState>;
  startStep?: number;
}

export function BlindConfigurator({ prefill, startStep = 0 }: BlindConfiguratorProps) {
  const [step, setStep] = useState(startStep);
  const [state, setState] = useState<BlindState>({ ...INITIAL_STATE, ...prefill });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [ranges, setRanges] = useState<RangeOption[]>([]);
  const [loading, setLoading] = useState(true);
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
          range_id: state.range_id,
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

  // Trigger price when reaching quote step
  useEffect(() => {
    if (step === 4) calculatePrice();
  }, [step, calculatePrice]);

  const selectedRange = ranges.find((r) => r.id === state.range_id);

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!state.category_id;
      case 1:
        return !!state.type_id && !!state.range_id;
      case 2:
        return !!state.colour;
      case 3:
        return state.width_mm >= 300 && state.drop_mm >= 300;
      default:
        return false;
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
              className={`text-xs transition-colors ${
                i === step
                  ? "font-semibold text-primary"
                  : i < step
                    ? "cursor-pointer text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/50"
              }`}
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
            <StepBlindQuote
              quote={quote}
              loading={quoteLoading}
              error={quoteError}
              state={state}
              categories={categories}
              types={types}
              ranges={ranges}
              onRecalculate={calculatePrice}
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
        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button disabled>Add to Cart (Coming Soon)</Button>
        )}
      </div>
    </div>
  );
}
