"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";
import { trackViewContent, trackAddToCart } from "@/lib/integrations/facebook-pixel";
import { siteConfig } from "@/config/site";
import type { Product } from "@/types";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    trackViewContent({
      content_name: product.name.en,
      content_type: "product",
      value: product.price_cents / 100,
      currency: siteConfig.currency,
    });
  }, [product]);

  function handleAdd() {
    addItem(
      {
        product_id: product.id,
        name: product.name.en,
        price_cents: product.price_cents,
        image: product.images?.[0],
        slug: product.slug,
      },
      quantity
    );
    trackAddToCart({
      content_name: product.name.en,
      value: (product.price_cents * quantity) / 100,
      currency: siteConfig.currency,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const inStock = product.stock_quantity > 0;

  return (
    <div className="mt-8 flex items-center gap-4">
      <div className="flex items-center rounded-md border">
        <button
          type="button"
          className="px-3 py-2 text-lg hover:bg-muted"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={!inStock}
        >
          -
        </button>
        <span className="min-w-[3rem] text-center">{quantity}</span>
        <button
          type="button"
          className="px-3 py-2 text-lg hover:bg-muted"
          onClick={() =>
            setQuantity((q) => Math.min(product.stock_quantity, q + 1))
          }
          disabled={!inStock}
        >
          +
        </button>
      </div>
      <Button
        size="lg"
        onClick={handleAdd}
        disabled={!inStock}
        className="flex-1"
      >
        {added ? "Added!" : inStock ? "Add to Cart" : "Out of Stock"}
      </Button>
    </div>
  );
}
