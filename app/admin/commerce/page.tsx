import { getCoupons, getGifts } from "@/lib/admin/commerce-actions";
import { CouponsTab } from "./coupons-tab";
import { GiftsTab } from "./gifts-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, Gift } from "lucide-react";

export default async function AdminCommercePage() {
  const [coupons, gifts] = await Promise.all([getCoupons(), getGifts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commerce</h1>
        <p className="text-sm text-muted-foreground">
          Manage coupons, gift codes, and commerce extras.
        </p>
      </div>

      <Tabs defaultValue="coupons">
        <TabsList>
          <TabsTrigger value="coupons">
            <Tag className="mr-1.5 h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="gifts">
            <Gift className="mr-1.5 h-4 w-4" />
            Gifts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="mt-4">
          <CouponsTab coupons={coupons} />
        </TabsContent>

        <TabsContent value="gifts" className="mt-4">
          <GiftsTab gifts={gifts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
