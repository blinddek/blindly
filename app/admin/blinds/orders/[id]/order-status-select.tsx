"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateBlindlyOrderStatus } from "@/lib/admin/actions";

const ORDER_STATUSES = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ordered_from_supplier", label: "Ordered from Supplier" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "installed", label: "Installed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  confirmed:
    "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  ordered_from_supplier:
    "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  shipped:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  delivered:
    "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  installed:
    "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300",
};

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    setError(null);
    startTransition(async () => {
      const result = await updateBlindlyOrderStatus(orderId, newStatus);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const style =
    STATUS_STYLES[currentStatus] ?? "border-border bg-card text-foreground";

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium outline-none cursor-pointer transition-colors disabled:opacity-50 ${style}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
