import { ensureAdmin } from "@/lib/admin/auth";
import { getAllCreditBalances } from "@/lib/admin/credit-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminCreditsPage() {
  await ensureAdmin();
  const balances = await getAllCreditBalances();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/booking"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Bookings
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Session Credits
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage client session credit balances.
        </p>
      </div>

      {balances.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No credit balances found.
        </p>
      ) : (
        <div className="space-y-3">
          {balances.map((client) => (
            <Link
              key={client.userId}
              href={`/admin/booking/credits/${client.userId}`}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.clientName}</span>
                      <Badge
                        variant={client.balance > 0 ? "default" : "outline"}
                      >
                        {client.balance > 0 ? "Active" : "Zero"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.clientEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{client.balance}</p>
                    <p className="text-xs text-muted-foreground">credits</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
