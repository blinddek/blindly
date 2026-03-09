"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useBlindCart } from "@/components/blinds/blind-cart-provider";

export function BlindCartIcon() {
  const { totalItems, hydrated } = useBlindCart();
  const count = hydrated ? totalItems : 0;

  return (
    <Link
      href="/cart"
      className="relative rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Blind cart (${count} item${count !== 1 ? "s" : ""})`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
