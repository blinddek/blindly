"use client";

import { useState, useTransition } from "react";
import {
  createCoupon,
  toggleCoupon,
  deleteCoupon,
} from "@/lib/admin/commerce-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Tag, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface CouponsTabProps {
  readonly coupons: Coupon[];
}

export function CouponsTab({ coupons: initialCoupons }: CouponsTabProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  function resetForm() {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxUses("");
    setExpiresAt("");
  }

  function handleCreate() {
    if (!code.trim() || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    startTransition(async () => {
      const result = await createCoupon({
        code: code.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_uses: maxUses ? Number(maxUses) : undefined,
        expires_at: expiresAt || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Coupon created");
        resetForm();
        setOpen(false);
      }
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const result = await toggleCoupon(id, active);
      if (result.error) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result.error) toast.error(result.error);
      else toast.success("Coupon deleted");
    });
  }

  function formatDiscount(type: string, value: number) {
    if (type === "percentage") return `${value}%`;
    return `R${value} off`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Coupons</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SUMMER20"
                  className="mt-1 font-mono uppercase"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="discount-type">Type</Label>
                  <select
                    id="discount-type"
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(
                        e.target.value as "percentage" | "fixed"
                      )
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (R)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="discount-value">Value</Label>
                  <Input
                    id="discount-value"
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "20" : "50"}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="max-uses">
                    Max Uses{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="max-uses"
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="expires-at">
                    Expires{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="expires-at"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {initialCoupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Tag className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No coupons yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first coupon code to offer discounts.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialCoupons.map((coupon) => {
            const expired =
              coupon.expires_at && new Date(coupon.expires_at) < new Date();

            return (
              <Card key={coupon.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {coupon.code}
                      </span>
                      <Badge
                        variant={
                          coupon.discount_type === "percentage"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {formatDiscount(
                          coupon.discount_type,
                          coupon.discount_value
                        )}
                      </Badge>
                      {expired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {coupon.times_used ?? 0}
                      {coupon.max_uses ? `/${coupon.max_uses}` : ""} uses
                      {coupon.expires_at &&
                        ` \u00b7 Expires ${new Date(coupon.expires_at).toLocaleDateString("en-ZA")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={(checked) =>
                        handleToggle(coupon.id, checked)
                      }
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
