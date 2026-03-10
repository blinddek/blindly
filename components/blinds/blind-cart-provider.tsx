"use client";

import type { SelectedExtra } from "@/types/blinds";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export interface BlindCartItem {
  /** Unique ID per cart line (UUID generated on add) */
  id: string;
  blind_range_id: string;
  range_name: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  type_id: string;
  type_name: string;
  colour: string;
  mount_type: "inside" | "outside";
  width_mm: number;
  drop_mm: number;
  control_side: "left" | "right";
  matched_width_cm: number;
  matched_drop_cm: number;
  /** Ex-VAT blind price only */
  customer_price_cents: number;
  /** VAT on blind only */
  vat_cents: number;
  /** Blind + accessories incl. VAT */
  total_with_vat_cents: number;
  /** Selected accessories (prices ex-VAT) */
  selected_extras: SelectedExtra[];
  /** Sum of extras ex-VAT */
  extras_cents: number;
  /** Optional room label, e.g. "Kitchen" */
  location_label?: string;
}

interface BlindCartContextValue {
  items: BlindCartItem[];
  hydrated: boolean;
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
  // Always start empty — localStorage is not available on the server.
  // hydrated flips true after the first client-side effect, at which point
  // the real cart is loaded and any localStorage writes are safe.
  const [items, setItems] = useState<BlindCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage once on mount (client only)
  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

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

  const value = useMemo<BlindCartContextValue>(
    () => ({
      items,
      hydrated,
      addItem,
      removeItem,
      updateLabel,
      clearCart,
      totalItems,
      subtotalCents,
      vatCents,
      grandTotalCents,
    }),
    [items, hydrated, addItem, removeItem, updateLabel, clearCart, totalItems, subtotalCents, vatCents, grandTotalCents]
  );

  return (
    <BlindCartContext.Provider value={value}>
      {children}
    </BlindCartContext.Provider>
  );
}

export function useBlindCart(): BlindCartContextValue {
  const ctx = useContext(BlindCartContext);
  if (!ctx) throw new Error("useBlindCart must be used within BlindCartProvider");
  return ctx;
}
