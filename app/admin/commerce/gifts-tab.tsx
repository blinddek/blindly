"use client";

import { useState, useTransition } from "react";
import { createGift, deleteGift } from "@/lib/admin/commerce-actions";
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
import { Plus, Gift, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GiftRecord {
  id: string;
  code: string;
  gift_type: "course" | "product" | "credits";
  target_id: string | null;
  amount: number | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string | null;
  created_at: string;
}

interface GiftsTabProps {
  readonly gifts: GiftRecord[];
}

const giftTypeBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  course: "default",
  product: "secondary",
  credits: "outline",
};

export function GiftsTab({ gifts: initialGifts }: GiftsTabProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [giftType, setGiftType] = useState<"course" | "product" | "credits">(
    "credits"
  );
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  function resetForm() {
    setCode("");
    setGiftType("credits");
    setTargetId("");
    setAmount("");
    setExpiresAt("");
  }

  function handleCreate() {
    if (!code.trim()) {
      toast.error("Gift code is required");
      return;
    }
    startTransition(async () => {
      const result = await createGift({
        code: code.trim(),
        gift_type: giftType,
        target_id: targetId || undefined,
        amount: amount ? Number(amount) : undefined,
        expires_at: expiresAt || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Gift created");
        resetForm();
        setOpen(false);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteGift(id);
      if (result.error) toast.error(result.error);
      else toast.success("Gift deleted");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Gifts</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Gift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Gift Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gift-code">Code</Label>
                <Input
                  id="gift-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="GIFT-ABC123"
                  className="mt-1 font-mono uppercase"
                />
              </div>
              <div>
                <Label htmlFor="gift-type">Type</Label>
                <select
                  id="gift-type"
                  value={giftType}
                  onChange={(e) =>
                    setGiftType(
                      e.target.value as "course" | "product" | "credits"
                    )
                  }
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="credits">Credits</option>
                  <option value="course">Course</option>
                  <option value="product">Product</option>
                </select>
              </div>
              {giftType !== "credits" && (
                <div>
                  <Label htmlFor="target-id">
                    Target ID{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="target-id"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder={`${giftType === "course" ? "Course" : "Product"} UUID`}
                    className="mt-1"
                  />
                </div>
              )}
              {giftType === "credits" && (
                <div>
                  <Label htmlFor="gift-amount">Amount</Label>
                  <Input
                    id="gift-amount"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="gift-expires">
                  Expires{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="gift-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Gift
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {initialGifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Gift className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No gift codes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create gift codes for courses, products, or credits.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialGifts.map((gift) => {
            const expired =
              gift.expires_at && new Date(gift.expires_at) < new Date();
            const redeemed = !!gift.redeemed_at;

            return (
              <Card key={gift.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {gift.code}
                      </span>
                      <Badge
                        variant={
                          giftTypeBadgeVariant[gift.gift_type] ?? "outline"
                        }
                      >
                        {gift.gift_type}
                      </Badge>
                      {redeemed && (
                        <Badge variant="secondary">Redeemed</Badge>
                      )}
                      {!redeemed && expired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {gift.amount != null && `${gift.amount} credits`}
                      {gift.expires_at &&
                        ` \u00b7 Expires ${new Date(gift.expires_at).toLocaleDateString("en-ZA")}`}
                      {redeemed &&
                        ` \u00b7 Redeemed ${new Date(gift.redeemed_at!).toLocaleDateString("en-ZA")}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(gift.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
