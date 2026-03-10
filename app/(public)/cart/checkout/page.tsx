"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBlindCart } from "@/components/blinds/blind-cart-provider";
import { AddressAutocomplete, type AddressResult } from "@/components/blinds/address-autocomplete";
import {
  getDiscountRate,
  calcDiscountCents,
  calcInstallationCents,
  calcTransportCents,
  calcCourierCents,
  calcTotalWeightKg,
  DEFAULT_INSTALLATION_PRICING,
  DEFAULT_VOLUME_DISCOUNTS,
  DEFAULT_COURIER_PRICING,
  type InstallationPricing,
  type VolumeDiscounts,
  type CourierPricing,
} from "@/types/pricing-rules";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Contact" },
  { id: 2, label: "Delivery" },
  { id: 3, label: "Installation" },
  { id: 4, label: "Notes" },
] as const;

function StepIndicator({ current }: Readonly<{ current: number }>) {
  return (
    <ol className="flex items-start mb-8">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors ${
                  done ? "bg-primary border-primary text-primary-foreground" : ""
                } ${
                  !done && active ? "border-primary text-primary bg-background" : ""
                } ${
                  !done && !active ? "border-muted-foreground/30 text-muted-foreground bg-background" : ""
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`mt-1 text-xs hidden sm:block ${
                  active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Installation fee cell in order summary ────────────────────────────────────

function InstallFeeCell({
  label,
  distanceCalculated,
  calcingDistance,
  feeCents,
}: Readonly<{
  label: string;
  distanceCalculated: boolean;
  calcingDistance: boolean;
  feeCents: number;
}>) {
  let feeDisplay: React.ReactNode = <span className="text-muted-foreground">—</span>;
  if (distanceCalculated) feeDisplay = <span>{feeCents === 0 ? "Free" : formatRand(feeCents)}</span>;
  else if (calcingDistance) feeDisplay = <Loader2 className="h-3.5 w-3.5 animate-spin self-center" />;

  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      {feeDisplay}
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1Contact({ name, email, phone, onChange }: Readonly<{
  name: string; email: string; phone: string;
  onChange: (field: string, value: string) => void;
}>) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h2 className="font-semibold text-lg">Contact Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name *</Label>
            <Input id="name" value={name} onChange={(e) => onChange("name", e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => onChange("email", e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="phone">Phone number *</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="071 234 5678" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Step2Props {
  manualEntry: boolean;
  address_line_1: string;
  city: string;
  province: string;
  postal_code: string;
  onAddressSelect: (result: AddressResult) => void;
  onChange: (field: string, value: string) => void;
  onEnableManual: () => void;
  onDisableManual: () => void;
}

function Step2Delivery({
  manualEntry, address_line_1, city, province, postal_code,
  onAddressSelect, onChange, onEnableManual, onDisableManual,
}: Readonly<Step2Props>) {
  function field(id: string, label: string, value: string, placeholder: string) {
    return (
      <div className={`space-y-1.5${id === "address" ? " sm:col-span-2" : ""}`}>
        <Label htmlFor={id} className={manualEntry ? undefined : "text-muted-foreground"}>
          {label}{manualEntry && (id === "address" || id === "city") ? " *" : ""}
        </Label>
        <Input
          id={id}
          readOnly={!manualEntry}
          value={value}
          onChange={manualEntry ? (e) => onChange(id === "address" ? "address_line_1" : id, e.target.value) : undefined}
          placeholder={manualEntry ? placeholder : "Auto-filled"}
          className={manualEntry ? undefined : "bg-muted/40 cursor-default"}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h2 className="font-semibold text-lg">Delivery Address</h2>
        {!manualEntry && (
          <div className="space-y-1.5">
            <Label>Search address *</Label>
            <AddressAutocomplete onSelect={onAddressSelect} placeholder="e.g. 12 Main Street, Cape Town" />
            <p className="text-xs text-muted-foreground">
              Select a suggestion from the dropdown — the fields below will fill automatically.
            </p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {field("address", "Street address", address_line_1, "12 Main Street")}
          {field("city", "City", city, "Cape Town")}
          {field("province", "Province", province, "Western Cape")}
          {field("postal_code", "Postal code", postal_code, "8001")}
        </div>
        <div className="border-t pt-3">
          {manualEntry ? (
            <button type="button" onClick={onDisableManual}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors">
              ← Search address instead
            </button>
          ) : (
            <button type="button" onClick={onEnableManual}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors">
              Can't find your address? Enter manually →
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface Step3Props {
  deliveryType: "self_install" | "professional_install";
  rulesLoaded: boolean;
  calcingDistance: boolean;
  distanceCalculated: boolean;
  relevantFeeCents: number;
  laborCents: number;
  feeLabel: string;
  showCourierSuggestion: boolean;
  courierCents: number;
  packageWeightKg: number;
  packageDimsCm: [number, number];
  onDeliveryTypeChange: (v: string) => void;
  onSwitchToSelfInstall: () => void;
}

function Step3Installation({
  deliveryType, rulesLoaded, calcingDistance, distanceCalculated,
  relevantFeeCents, laborCents, feeLabel,
  showCourierSuggestion, courierCents, packageWeightKg, packageDimsCm,
  onDeliveryTypeChange, onSwitchToSelfInstall,
}: Readonly<Step3Props>) {
  const isSelfInstall = deliveryType === "self_install";
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h2 className="font-semibold text-lg">Installation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { value: "self_install", label: "Self-install", desc: "We deliver, you fit" },
            { value: "professional_install", label: "Professional install", desc: "We deliver and fit" },
          ] as const).map((opt) => (
            <label key={opt.value} aria-label={opt.label}
              className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                deliveryType === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}>
              <input type="radio" name="delivery_type" value={opt.value}
                checked={deliveryType === opt.value}
                onChange={() => onDeliveryTypeChange(opt.value)}
                className="mt-0.5" />
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {rulesLoaded && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
            {isSelfInstall && (
              <p className="text-xs text-muted-foreground">
                Your package is estimated at {packageDimsCm[0]} cm × {packageDimsCm[1]} cm and weighs approximately {packageWeightKg.toFixed(1)} kg
              </p>
            )}
            {!isSelfInstall && calcingDistance && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating fee…
              </div>
            )}
            {(isSelfInstall || (!calcingDistance && distanceCalculated)) && (
              <div className="flex items-center justify-between font-medium">
                <span>{feeLabel}</span>
                <span>{relevantFeeCents === 0 ? "Free" : formatRand(relevantFeeCents)}</span>
              </div>
            )}
            {!isSelfInstall && !calcingDistance && !distanceCalculated && (
              <>
                <div className="flex items-center justify-between font-medium">
                  <span>Installation (labour)</span>
                  <span>{laborCents === 0 ? "Free" : formatRand(laborCents)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Transport fee will be confirmed before installation.</p>
              </>
            )}
          </div>
        )}
        {showCourierSuggestion && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm space-y-2">
            <p className="font-medium text-primary">
              Save {formatRand(relevantFeeCents - courierCents)} with self-installation!
            </p>
            <p className="text-muted-foreground text-xs">
              Courier delivery costs only {formatRand(courierCents)} — cheaper than professional installation.
              Consider having us deliver and fitting the blinds yourself or using a local installer.
            </p>
            <button
              type="button"
              onClick={onSwitchToSelfInstall}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Switch to self-install ({formatRand(courierCents)})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Step4Notes({ notes, onChange }: Readonly<{ notes: string; onChange: (v: string) => void }>) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h2 className="font-semibold text-lg">Order Notes</h2>
        <p className="text-sm text-muted-foreground">
          Optional — special instructions, access notes, preferred installation time, etc.
        </p>
        <textarea value={notes} onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Ring the gate bell, available after 10am…"
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BlindCheckoutPage() {
  const router = useRouter();
  const { items, hydrated, grandTotalCents, subtotalCents, vatCents, clearCart } = useBlindCart();

  const [step, setStep] = useState(1);
  const [manualEntry, setManualEntry] = useState(false);
  const [form, setForm] = useState(() => {
    const defaults = {
      name: "",
      email: "",
      phone: "",
      address_line_1: "",
      city: "",
      province: "",
      postal_code: "",
      address_lat: "",
      address_lng: "",
      delivery_type: "self_install" as "self_install" | "professional_install",
      distance_km: "",
      notes: "",
    };
    try {
      const saved = globalThis.window ? localStorage.getItem("blindly_checkout") : null;
      if (saved) return { ...defaults, ...(JSON.parse(saved) as typeof defaults) };
    } catch { /* ignore */ }
    return defaults;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calcingDistance, setCalcingDistance] = useState(false);

  const [installRules, setInstallRules] = useState<InstallationPricing>(DEFAULT_INSTALLATION_PRICING);
  const [discountRules, setDiscountRules] = useState<VolumeDiscounts>(DEFAULT_VOLUME_DISCOUNTS);
  const [courierRules, setCourierRules] = useState<CourierPricing>(DEFAULT_COURIER_PRICING);
  const [rulesLoaded, setRulesLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/pricing-rules")
      .then((r) => r.json())
      .then((d: { installation_pricing?: InstallationPricing; volume_discounts?: VolumeDiscounts; courier_pricing?: CourierPricing }) => {
        if (d.installation_pricing) setInstallRules(d.installation_pricing);
        if (d.volume_discounts) setDiscountRules(d.volume_discounts);
        if (d.courier_pricing) setCourierRules(d.courier_pricing);
      })
      .finally(() => setRulesLoaded(true));
  }, []);

  // Persist form so returning visitors don't retype their details
  useEffect(() => {
    try { localStorage.setItem("blindly_checkout", JSON.stringify(form)); } catch { /* ignore */ }
  }, [form]);

  if (!hydrated) return null;
  if (items.length === 0) {
    router.replace("/cart");
    return null;
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Derived pricing
  const discountRate = getDiscountRate(grandTotalCents, discountRules);
  const discountCents = calcDiscountCents(grandTotalCents, discountRate);
  const blindsTotal = grandTotalCents - discountCents;

  const isProfessional = form.delivery_type === "professional_install";
  const distanceKm = Number.parseFloat(form.distance_km) || 0;
  const distanceCalculated = form.distance_km !== "";

  const installLaborCents = isProfessional ? calcInstallationCents(items.length, installRules) : 0;
  const transportCents = distanceCalculated ? calcTransportCents(distanceKm, installRules) : 0;

  // Self-install: courier cost by weight. Professional: labor + transport.
  const courierCents = calcCourierCents(items, courierRules);
  const packageWeightKg = Math.round(calcTotalWeightKg(items, courierRules) * 10) / 10;
  // Dimensions: length = widest blind (cm), depth = ~6 cm per blind stacked (min 10 cm)
  const maxWidthCm = Math.ceil(Math.max(...items.map((i) => i.width_mm), 0) / 10);
  const stackDepthCm = Math.max(10, items.length * 6);
  const packageDimsCm: [number, number] = [maxWidthCm, stackDepthCm];
  const professionalFeeCents = installLaborCents + transportCents;
  const relevantFeeCents = isProfessional ? professionalFeeCents : courierCents;

  // Suggest courier only for distant clients where transport alone is ≥3× courier cost
  const showCourierSuggestion =
    isProfessional &&
    distanceCalculated &&
    !calcingDistance &&
    distanceKm >= 50 &&
    transportCents >= courierCents * 3;

  const feeKnown = isProfessional ? distanceCalculated : true; // courier fee always known for self-install
  const orderTotalCents = blindsTotal + (feeKnown ? relevantFeeCents : 0);

  // ── Distance calculation ────────────────────────────────────────────────────

  async function calcDistance(coords?: { lat: number; lng: number }) {
    const hasCoords =
      coords ??
      (form.address_lat && form.address_lng
        ? { lat: Number.parseFloat(form.address_lat), lng: Number.parseFloat(form.address_lng) }
        : null);

    // Manual entry fallback: geocode from text fields
    if (!hasCoords && (!form.address_line_1 || !form.city)) return;

    setCalcingDistance(true);
    try {
      const body = hasCoords
        ? { lat: hasCoords.lat, lng: hasCoords.lng }
        : { address: form.address_line_1, city: form.city, province: form.province, postal_code: form.postal_code };

      const res = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { distance_km?: number; error?: string };
      if (data.distance_km != null) {
        set("distance_km", String(data.distance_km));
      }
      // If geocoding fails, distance stays unknown — transport shown as "to be confirmed"
    } catch {
      // Silently swallow — transport shown as "to be confirmed"
    } finally {
      setCalcingDistance(false);
    }
  }

  function handleAddressSelect(result: AddressResult) {
    setForm((f) => ({
      ...f,
      address_line_1: result.street,
      city: result.city,
      province: result.province,
      postal_code: result.postal_code,
      address_lat: String(result.lat),
      address_lng: String(result.lng),
      distance_km: "", // reset when address changes
    }));
    if (form.delivery_type === "professional_install") {
      calcDistance({ lat: result.lat, lng: result.lng });
    }
  }

  // ── Step navigation ─────────────────────────────────────────────────────────

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.name.trim()) return "Please enter your full name.";
      if (!form.email.trim()) return "Please enter your email address.";
      if (!form.phone.trim()) return "Please enter your phone number.";
    }
    if (step === 2) {
      if (!form.address_line_1 || !form.city)
        return manualEntry
          ? "Please enter your street address and city."
          : "Please search and select a delivery address.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    // In manual entry mode, trigger distance calc when leaving step 2 (professional only)
    if (step === 2 && manualEntry && !distanceCalculated && form.delivery_type === "professional_install") {
      calcDistance();
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  // ── Submission ──────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/blinds/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            blind_range_id: item.blind_range_id,
            colour: item.colour,
            mount_type: item.mount_type,
            width_mm: item.width_mm,
            drop_mm: item.drop_mm,
            control_side: item.control_side,
            matched_width_cm: item.matched_width_cm,
            matched_drop_cm: item.matched_drop_cm,
            location_label: item.location_label ?? "",
            selected_extras: item.selected_extras ?? [],
          })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          delivery_address: {
            street: form.address_line_1,
            city: form.city,
            province: form.province,
            postal_code: form.postal_code,
          },
          delivery_type: form.delivery_type,
          distance_km: distanceKm || null,
          customer_notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Checkout failed. Please try again.");
        return;
      }
      sessionStorage.setItem("blindly_order_ref", data.reference);
      clearCart();
      try { localStorage.removeItem("blindly_checkout"); } catch { /* ignore */ }
      globalThis.location.href = data.authorization_url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step content ────────────────────────────────────────────────────────────

  function renderStep() {
    if (step === 1) return (
      <Step1Contact name={form.name} email={form.email} phone={form.phone} onChange={set} />
    );
    if (step === 2) return (
      <Step2Delivery
        manualEntry={manualEntry}
        address_line_1={form.address_line_1}
        city={form.city}
        province={form.province}
        postal_code={form.postal_code}
        onAddressSelect={handleAddressSelect}
        onChange={set}
        onEnableManual={() => {
          setManualEntry(true);
          setForm((f) => ({ ...f, address_lat: "", address_lng: "", distance_km: "" }));
        }}
        onDisableManual={() => {
          setManualEntry(false);
          setForm((f) => ({ ...f, address_line_1: "", city: "", province: "", postal_code: "", address_lat: "", address_lng: "", distance_km: "" }));
        }}
      />
    );
    if (step === 3) return (
      <Step3Installation
        deliveryType={form.delivery_type}
        rulesLoaded={rulesLoaded}
        calcingDistance={calcingDistance}
        distanceCalculated={distanceCalculated}
        relevantFeeCents={relevantFeeCents}
        laborCents={installLaborCents}
        feeLabel={isProfessional ? "Installation fee" : "Courier delivery fee"}
        distanceKmValue={form.distance_km}
        showCourierSuggestion={showCourierSuggestion}
        courierCents={courierCents}
        packageWeightKg={packageWeightKg}
        packageDimsCm={packageDimsCm}
        onDeliveryTypeChange={(v) => {
          set("delivery_type", v);
          if (v === "professional_install" && !distanceCalculated) {
            const coords = form.address_lat && form.address_lng
              ? { lat: Number.parseFloat(form.address_lat), lng: Number.parseFloat(form.address_lng) }
              : undefined;
            calcDistance(coords);
          }
        }}
        onSwitchToSelfInstall={() => set("delivery_type", "self_install")}
      />
    );
    return (
      <Step4Notes notes={form.notes} onChange={(v) => set("notes", v)} />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isLastStep = step === STEPS.length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/cart"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to cart
      </Link>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

      <StepIndicator current={step} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — step content */}
        <div className="space-y-4 lg:col-span-2">
          {renderStep()}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {isLastStep ? (
              <Button onClick={handleSubmit} disabled={submitting} size="lg">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  `Pay ${formatRand(orderTotalCents)}`
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-5">
              <h2 className="mb-4 font-semibold">Order Summary</h2>

              <ul className="mb-4 space-y-2 text-sm">
                {items.map((item, idx) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="text-muted-foreground line-clamp-1">
                      {idx + 1}. {item.range_name} — {item.colour}
                    </span>
                    <span className="shrink-0">{formatRand(item.total_with_vat_cents)}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-1.5 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatRand(subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (15%)</span>
                  <span>{formatRand(vatCents)}</span>
                </div>
                {discountRate > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Volume discount ({(discountRate * 100).toFixed(1)}%)</span>
                    <span>−{formatRand(discountCents)}</span>
                  </div>
                )}
                {step >= 3 && (
                  <InstallFeeCell
                    label={isProfessional ? "Installation fee" : "Courier delivery fee"}
                    distanceCalculated={feeKnown}
                    calcingDistance={calcingDistance}
                    feeCents={relevantFeeCents}
                  />
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatRand(orderTotalCents)}</span>
                </div>
              </div>

              {step >= 2 && form.address_line_1 && (
                <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">Delivery address</p>
                  <p>{form.address_line_1}</p>
                  <p>{[form.city, form.province, form.postal_code].filter(Boolean).join(", ")}</p>
                </div>
              )}

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Secure payment via Paystack.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
