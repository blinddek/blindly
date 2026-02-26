"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/shop/cart-provider";

export function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/shop/cart"
      className="relative rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Cart (${totalItems} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
