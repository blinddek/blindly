"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";
import { formatPrice } from "@/lib/shop/format";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotalCents, totalItems } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
        <h1 className="text-3xl font-bold text-foreground">Your Cart</h1>
        <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
        <Link href="/shop">
          <Button className="mt-6">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold text-foreground">
        Your Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="divide-y rounded-xl border">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex gap-4 p-4"
              >
                {/* Image */}
                <Link
                  href={`/shop/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-md border">
                      <button
                        type="button"
                        className="px-2 py-1 text-sm hover:bg-muted"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span className="min-w-[2rem] text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-2 py-1 text-sm hover:bg-muted"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(item.price_cents * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">
                Calculated at checkout
              </span>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
          </div>
          <Link href="/shop/checkout">
            <Button className="mt-6 w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
