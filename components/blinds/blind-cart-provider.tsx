"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface BlindCartItem {
  /** Unique ID per cart line (UUID generated on add) */
  id: string;
  blind_range_id: string;
  range_name: string;
  category_name: string;
  type_name: string;
  colour: string;
  mount_type: "inside" | "outside";
  width_mm: number;
  drop_mm: number;
  control_side: "left" | "right";
  matched_width_cm: number;
  matched_drop_cm: number;
  /** Ex-VAT customer price */
  customer_price_cents: number;
  vat_cents: number;
  total_with_vat_cents: number;
  /** Optional room label, e.g. "Kitchen" */
  location_label?: string;
}

interface BlindCartContextValue {
  items: BlindCartItem[];
  addItem: (item: BlindCartItem) => void;
  removeItem: (id: string) => void;
  updateLabel: (id: string, label: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalCents: number;
  vatCents: number;
  grandTotalCents: number;
}

const BlindCartContext = createContext<BlindCartContextValue | null>(null);

const STORAGE_KEY = "blindly-cart";

function readStoredCart(): BlindCartItem[] {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as BlindCartItem[]) : [];
  } catch {
    return [];
  }
}

export function BlindCartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [items, setItems] = useState<BlindCartItem[]>(readStoredCart);
  const hydratedRef = useRef(typeof window !== "undefined");

  useEffect(() => {
    if (!hydratedRef.current) return;
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: BlindCartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateLabel = useCallback((id: string, label: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, location_label: label } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.length;
  const subtotalCents = items.reduce((s, i) => s + i.customer_price_cents, 0);
  const vatCents = items.reduce((s, i) => s + i.vat_cents, 0);
  const grandTotalCents = items.reduce((s, i) => s + i.total_with_vat_cents, 0);

  return (
    <BlindCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateLabel,
        clearCart,
        totalItems,
        subtotalCents,
        vatCents,
        grandTotalCents,
      }}
    >
      {children}
    </BlindCartContext.Provider>
  );
}

export function useBlindCart(): BlindCartContextValue {
  const ctx = useContext(BlindCartContext);
  if (!ctx) throw new Error("useBlindCart must be used within BlindCartProvider");
  return ctx;
}
