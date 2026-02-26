"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  adminAddCredits,
  adminAdjustCredits,
} from "@/lib/admin/credit-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "purchase" | "refund" | "forfeit" | "debit" | "manual";
  description: string;
  booking_id: string | null;
  created_at: string;
}

const typeBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  purchase: "default",
  refund: "secondary",
  forfeit: "destructive",
  debit: "outline",
  manual: "secondary",
};

export default function ClientCreditsDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Add credits dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Adjust credits dialog state
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  async function loadData() {
    const supabase = createClient();

    // Fetch balance
    const { data: balanceRow } = await supabase
      .from("session_credit_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();
    setBalance(balanceRow?.balance ?? 0);

    // Fetch transactions
    const { data: txns } = await supabase
      .from("session_credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setTransactions((txns as Transaction[]) ?? []);

    // Fetch profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();
    setClientName(profile?.full_name ?? "Unknown");
    setClientEmail(profile?.email ?? "");

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleAddCredits() {
    const amt = Number(addAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    setAddSubmitting(true);
    const result = await adminAddCredits(userId, amt, addDescription);
    setAddSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${amt} credit(s)`);
      setAddOpen(false);
      setAddAmount("");
      setAddDescription("");
      await loadData();
    }
  }

  async function handleAdjustCredits() {
    const amt = Number(adjustAmount);
    if (!amt || amt === 0) {
      toast.error("Enter a non-zero amount");
      return;
    }
    setAdjustSubmitting(true);
    const result = await adminAdjustCredits(userId, amt, adjustDescription);
    setAdjustSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Adjusted balance by ${amt > 0 ? "+" : ""}${amt}`);
      setAdjustOpen(false);
      setAdjustAmount("");
      setAdjustDescription("");
      await loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/booking/credits"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Credits
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          {clientName}
        </h1>
        <p className="text-sm text-muted-foreground">{clientEmail}</p>
      </div>

      {/* Balance card */}
      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-4xl font-bold">{balance}</p>
            <p className="text-sm text-muted-foreground">credits</p>
          </div>
          <div className="flex gap-2">
            {/* Add Credits Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Credits
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Credits</DialogTitle>
                  <DialogDescription>
                    Add session credits to {clientName}&apos;s account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="add-amount">Amount</Label>
                    <Input
                      id="add-amount"
                      type="number"
                      min={1}
                      placeholder="e.g. 5"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-description">Description</Label>
                    <Input
                      id="add-description"
                      placeholder="e.g. Package purchase"
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddCredits}
                    disabled={addSubmitting}
                  >
                    {addSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Credits
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Adjust Balance Dialog */}
            <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Adjust
                  Balance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adjust Balance</DialogTitle>
                  <DialogDescription>
                    Manually adjust {clientName}&apos;s credit balance. Use a
                    negative number to subtract.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="adjust-amount">Amount</Label>
                    <Input
                      id="adjust-amount"
                      type="number"
                      placeholder="e.g. -2 or 3"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adjust-description">Description</Label>
                    <Input
                      id="adjust-description"
                      placeholder="e.g. Correction for missed session"
                      value={adjustDescription}
                      onChange={(e) => setAdjustDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAdjustCredits}
                    disabled={adjustSubmitting}
                  >
                    {adjustSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Adjust Balance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transaction history */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transactions yet.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Amount
                      </th>
                      <th className="px-4 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(txn.created_at).toLocaleString("en-ZA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={typeBadgeVariant[txn.type] ?? "outline"}
                          >
                            {txn.type}
                          </Badge>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                            txn.amount > 0
                              ? "text-green-600"
                              : txn.amount < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {txn.amount > 0 ? "+" : ""}
                          {txn.amount}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {txn.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
