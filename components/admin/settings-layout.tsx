"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

/**
 * Reusable settings layout with sidebar on desktop, horizontal scroll nav on mobile.
 *
 * Usage:
 *   <SettingsLayout
 *     title="Site Settings"
 *     description="Business identity, contact details, and integrations."
 *     tabs={[
 *       { key: "general", label: "General", icon: Settings },
 *       { key: "finance", label: "Finance", icon: CreditCard },
 *     ]}
 *   >
 *     {(activeTab) => (
 *       <>
 *         {activeTab === "general" && <GeneralPanel />}
 *         {activeTab === "finance" && <FinancePanel />}
 *       </>
 *     )}
 *   </SettingsLayout>
 */

interface Tab {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SettingsLayoutProps {
  title: string;
  description?: string;
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
  onSave?: () => Promise<void>;
  saving?: boolean;
  saveLabel?: string;
}

export function SettingsLayout({
  title,
  description,
  tabs,
  defaultTab,
  children,
  onSave,
  saving,
  saveLabel = "Save Changes",
}: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-10rem)]">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex w-52 shrink-0 flex-col border-r pr-4">
          <div className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                    activeTab === tab.key
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile horizontal scroll nav */}
        <nav className="md:hidden flex gap-1 overflow-x-auto border-b px-1 pb-2 mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors shrink-0",
                  activeTab === tab.key
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content area */}
        <div className="flex-1 md:pl-6 md:overflow-y-auto">
          {children(activeTab)}

          {/* Mobile save button */}
          {onSave && (
            <div className="mt-6 border-t pt-4 md:hidden">
              <Button
                onClick={onSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving..." : saveLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
