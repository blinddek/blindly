"use client";

import Link from "next/link";
import { SettingsLayout } from "@/components/admin/settings-layout";
import { Upload, Search, ListChecks, Clock } from "lucide-react";
import { ImportTab, PriceCheckerTab, MappingsTab, HistoryTab } from "@/components/admin/blinds/import-tabs";

export default function PriceImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Dashboard
        </Link>
      </div>
      <SettingsLayout
        title="Price Import"
        description="Upload supplier price lists, map sheets to blind ranges, and manage import history."
        tabs={[
          { key: "import", label: "Import", icon: Upload },
          { key: "prices", label: "Prices", icon: Search },
          { key: "mappings", label: "Mappings", icon: ListChecks },
          { key: "history", label: "History", icon: Clock },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === "import" && <ImportTab />}
            {activeTab === "prices" && <PriceCheckerTab />}
            {activeTab === "mappings" && <MappingsTab />}
            {activeTab === "history" && <HistoryTab />}
          </>
        )}
      </SettingsLayout>
    </div>
  );
}
