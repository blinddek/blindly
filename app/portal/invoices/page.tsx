import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { formatPrice } from "@/lib/shop/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, ArrowRight } from "lucide-react";

const statusVariant: Record<string, "outline" | "default" | "secondary" | "destructive"> = {
  draft: "outline",
  sent: "default",
  paid: "secondary",
  void: "destructive",
};

export default async function PortalInvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const email = authUser?.email ?? user.email;

  // Fetch invoices where user_id matches OR client_email matches
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .or(`user_id.eq.${authUser?.id},client_email.eq.${email}`)
    .order("created_at", { ascending: false });

  const items = invoices ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View your invoices and payment history.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">No invoices yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You don&apos;t have any invoices at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((invoice) => {
            const dateDisplay = new Date(invoice.created_at).toLocaleDateString("en-ZA", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <Link key={invoice.id} href={`/portal/invoices/${invoice.id}`}>
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
                        {dateDisplay}
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
