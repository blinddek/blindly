"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBlindCart } from "@/components/blinds/blind-cart-provider";
import {
  getDiscountRate,
  calcDiscountCents,
  getInstallationTier,
  calcTransportCents,
  DEFAULT_INSTALLATION_PRICING,
  DEFAULT_VOLUME_DISCOUNTS,
  type InstallationPricing,
  type VolumeDiscounts,
} from "@/types/pricing-rules";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function BlindCheckoutPage() {
  const router = useRouter();
  const { items, grandTotalCents, subtotalCents, vatCents, clearCart } = useBlindCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address_line_1: "",
    city: "",
    province: "",
    postal_code: "",
    delivery_type: "self_install" as "self_install" | "professional_install",
    distance_km: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [installRules, setInstallRules] = useState<InstallationPricing>(DEFAULT_INSTALLATION_PRICING);
  const [discountRules, setDiscountRules] = useState<VolumeDiscounts>(DEFAULT_VOLUME_DISCOUNTS);
  const [rulesLoaded, setRulesLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/pricing-rules")
      .then((r) => r.json())
      .then((d: { installation_pricing?: InstallationPricing; volume_discounts?: VolumeDiscounts }) => {
        if (d.installation_pricing) setInstallRules(d.installation_pricing);
        if (d.volume_discounts) setDiscountRules(d.volume_discounts);
      })
      .finally(() => setRulesLoaded(true));
  }, []);

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
  const installTier = isProfessional ? getInstallationTier(items.length, installRules) : null;
  const installCents = installTier?.cost_cents ?? 0;
  const transportCents = isProfessional ? calcTransportCents(distanceKm, installRules) : 0;

  const orderTotalCents = blindsTotal + installCents + transportCents;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
          })),
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
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
      globalThis.location.href = data.authorization_url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: form fields */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold">Contact Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name *</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone">Phone number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="071 234 5678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery address */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold">Delivery Address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address">Street address *</Label>
                    <Input
                      id="address"
                      required
                      value={form.address_line_1}
                      onChange={(e) => set("address_line_1", e.target.value)}
                      placeholder="12 Main Street"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Cape Town"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      required
                      value={form.province}
                      onChange={(e) => set("province", e.target.value)}
                      placeholder="Western Cape"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postal">Postal code *</Label>
                    <Input
                      id="postal"
                      required
                      value={form.postal_code}
                      onChange={(e) => set("postal_code", e.target.value)}
                      placeholder="8001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Installation */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold">Installation</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "self_install",
                        label: "Self-install",
                        desc: "We deliver, you fit",
                      },
                      {
                        value: "professional_install",
                        label: "Professional install",
                        desc: "We deliver and fit",
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      aria-label={opt.label}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                        form.delivery_type === opt.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_type"
                        value={opt.value}
                        checked={form.delivery_type === opt.value}
                        onChange={() => set("delivery_type", opt.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Distance input — only for professional install */}
                {isProfessional && rulesLoaded && (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="distance">Approximate distance from us (km)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="distance"
                          type="number"
                          min={0}
                          step={1}
                          className="max-w-[160px]"
                          value={form.distance_km}
                          onChange={(e) => set("distance_km", e.target.value)}
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground">km</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Within {installRules.transport_free_radius_km} km — no transport fee.
                        Beyond that, R{(installRules.price_per_km_cents / 100).toFixed(2)}/km × 2 (round trip).
                      </p>
                    </div>

                    {/* Installation cost breakdown */}
                    <div className="mt-2 space-y-1 text-sm border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Installation ({items.length} blind{items.length !== 1 ? "s" : ""})
                        </span>
                        <span>{installCents === 0 ? "Free" : formatRand(installCents)}</span>
                      </div>
                      {distanceKm > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Transport ({distanceKm} km round trip)
                          </span>
                          <span>{transportCents === 0 ? "Free" : formatRand(transportCents)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-semibold">Order Notes (optional)</h2>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Special instructions, access notes, etc."
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: order summary + pay */}
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

                  {isProfessional && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Installation</span>
                        <span>{installCents === 0 ? "Free" : formatRand(installCents)}</span>
                      </div>
                      {distanceKm > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transport</span>
                          <span>{transportCents === 0 ? "Free" : formatRand(transportCents)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatRand(orderTotalCents)}</span>
                  </div>
                </div>

                {error && (
                  <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="mt-5 w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatRand(orderTotalCents)}`
                  )}
                </Button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  You will be redirected to Paystack to complete payment securely.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </section>
  );
}
