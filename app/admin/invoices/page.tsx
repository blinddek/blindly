export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAdmin } from "@/lib/admin/auth";
import { formatPrice } from "@/lib/shop/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  Plus,
  ArrowRight,
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  void: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  void: "Void",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await ensureAdmin();
  const params = await searchParams;
  const activeStatus = params.status || "all";

  const admin = createAdminClient();

  // Fetch all invoices
  let query = admin
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: invoices } = await query;
  const allInvoices = invoices ?? [];

  // Fetch counts per status (unfiltered)
  const { data: allForCounts } = await admin
    .from("invoices")
    .select("status, total_cents");

  const statusCounts: Record<string, number> = { all: 0, draft: 0, sent: 0, paid: 0, void: 0 };
  let totalRevenue = 0;
  let paidRevenue = 0;
  let outstanding = 0;

  for (const inv of (allForCounts ?? []) as { status: string; total_cents: number }[]) {
    statusCounts.all++;
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    totalRevenue += inv.total_cents;
    if (inv.status === "paid") paidRevenue += inv.total_cents;
    if (inv.status === "sent" || inv.status === "draft") outstanding += inv.total_cents;
  }

  // This month stats
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: monthInvoices } = await admin
    .from("invoices")
    .select("status, total_cents")
    .gte("created_at", monthStart);

  let thisMonthCount = 0;
  let paidThisMonth = 0;
  for (const inv of (monthInvoices ?? []) as { status: string; total_cents: number }[]) {
    thisMonthCount++;
    if (inv.status === "paid") paidThisMonth += inv.total_cents;
  }

  const statusTabs = ["all", "draft", "sent", "paid", "void"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {statusCounts.all} total invoices
          </p>
        </div>
        <Link href="/admin/invoices/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={FileText}
          label="This Month"
          value={String(thisMonthCount)}
          sub="invoices"
        />
        <SummaryCard
          icon={DollarSign}
          label="Paid This Month"
          value={formatPrice(paidThisMonth)}
          variant="green"
        />
        <SummaryCard
          icon={Clock}
          label="Outstanding"
          value={formatPrice(outstanding)}
          variant="yellow"
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatPrice(paidRevenue)}
          variant="green"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b pb-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/invoices" : `/admin/invoices?status=${tab}`}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors shrink-0 ${
              activeStatus === tab
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "all" ? "All" : STATUS_LABEL[tab] || tab}
            <span className="ml-1 text-xs text-muted-foreground">
              ({statusCounts[tab] || 0})
            </span>
          </Link>
        ))}
      </div>

      {/* Invoice table */}
      {allInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No invoices found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeStatus !== "all"
                  ? `No ${STATUS_LABEL[activeStatus]?.toLowerCase() || activeStatus} invoices.`
                  : "Invoices are auto-generated when orders are paid."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(inv.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{inv.client_name}</div>
                    <div className="text-xs text-muted-foreground">{inv.client_email}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatPrice(inv.total_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_BADGE[inv.status] || ""}
                    >
                      {STATUS_LABEL[inv.status] || inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/invoices/${inv.id}`}>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  variant,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
  sub?: string;
  variant?: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    yellow: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
    red: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${variant ? colors[variant] : "bg-card"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
