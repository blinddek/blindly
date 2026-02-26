import Link from "next/link";
import { getInvoices } from "@/lib/admin/invoice-actions";
import { formatPrice } from "@/lib/shop/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Plus, ArrowRight } from "lucide-react";

const statusVariant: Record<string, "outline" | "default" | "secondary" | "destructive"> = {
  draft: "outline",
  sent: "default",
  paid: "secondary",
  void: "destructive",
};

export default async function AdminBillingPage() {
  const invoices = await getInvoices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices &amp; Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage invoices and billing for your clients.
          </p>
        </div>
        <Link href="/admin/billing/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No invoices yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first invoice to get started.
              </p>
            </div>
            <Link href="/admin/billing/new">
              <Button variant="outline" size="sm">
                Create Invoice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const dateDisplay = new Date(invoice.created_at).toLocaleDateString("en-ZA", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <Link key={invoice.id} href={`/admin/billing/${invoice.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {invoice.invoice_number}
                        </span>
                        <Badge variant={statusVariant[invoice.status] ?? "outline"}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {invoice.client_name} &middot; {dateDisplay}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(invoice.total_cents)}</p>
                      <ArrowRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
