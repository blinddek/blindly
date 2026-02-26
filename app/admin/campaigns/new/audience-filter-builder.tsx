"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Filter,
  RotateCcw,
} from "lucide-react";
import {
  type AudienceFilters,
  CLIENT_STATUS_OPTIONS,
  SOURCE_OPTIONS,
  GENDER_OPTIONS,
  LAST_LOGIN_OPTIONS,
  AGE_PRESETS,
} from "@/lib/audience-filters";
import { isEnabled } from "@/config/features";
import { siteConfig } from "@/config/site";

interface AudienceFilterBuilderProps {
  readonly filters: AudienceFilters;
  readonly onChange: (filters: AudienceFilters) => void;
  readonly recipientCount: number | null;
  readonly onCount: () => void;
  readonly counting?: boolean;
}

// ── Collapsible Section ──
function FilterSection({
  title,
  description,
  badge,
  children,
  defaultOpen = false,
}: Readonly<{
  title: string;
  description?: string;
  badge?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{title}</span>
          {description && !open && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        {badge !== undefined && badge > 0 && (
          <Badge variant="secondary" className="text-xs">
            {badge} selected
          </Badge>
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

// ── Checkbox Grid ──
function CheckboxGrid({
  options,
  selected,
  onChange,
  columns = 2,
}: Readonly<{
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  columns?: number;
}>) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
          />
          <span className={selected.includes(opt.value) ? "font-medium" : ""}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

// ── Toggle Pill ──
function TogglePills({
  options,
  selected,
  onChange,
}: Readonly<{
  options: { value: string; label: string }[];
  selected: string | undefined;
  onChange: (value: string | undefined) => void;
}>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() =>
            onChange(selected === opt.value ? undefined : opt.value)
          }
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selected === opt.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-foreground/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Helpers: feature-gated visibility ──
const showGender = siteConfig.clientFields?.gender !== false;
const showAge = siteConfig.clientFields?.dateOfBirth !== false;
const showLastLogin = isEnabled("customerAuth");
const showEnrollment = isEnabled("lms");
const showOnboarding = isEnabled("clientOnboarding");

// ── Main Component ──
export function AudienceFilterBuilder({
  filters,
  onChange,
  recipientCount,
  onCount,
  counting = false,
}: AudienceFilterBuilderProps) {
  const set = useCallback(
    <K extends keyof AudienceFilters>(key: K, value: AudienceFilters[K]) => {
      const next = { ...filters, [key]: value };
      if (Array.isArray(value) && value.length === 0) {
        delete next[key];
      }
      if (value === undefined || value === null) {
        delete next[key];
      }
      onChange(next);
    },
    [filters, onChange]
  );

  const activeFilterCount = Object.keys(filters).filter((k) => {
    const v = filters[k as keyof AudienceFilters];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
    return v !== undefined && v !== null;
  }).length;

  const resetFilters = () => onChange({});

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Audience</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs text-muted-foreground"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border rounded-b-lg border-t border-border">
          {/* ── Client Status ── */}
          <FilterSection
            title="Client Status"
            badge={filters.clientStatus?.length}
            defaultOpen
          >
            <CheckboxGrid
              options={CLIENT_STATUS_OPTIONS}
              selected={filters.clientStatus || []}
              onChange={(v) => set("clientStatus", v)}
            />
          </FilterSection>

          {/* ── Source ── */}
          <FilterSection
            title="Source"
            badge={filters.source?.length}
          >
            <CheckboxGrid
              options={SOURCE_OPTIONS}
              selected={filters.source || []}
              onChange={(v) => set("source", v)}
            />
          </FilterSection>

          {/* ── Gender ── */}
          {showGender && (
            <FilterSection
              title="Gender"
              badge={filters.gender?.length}
            >
              <CheckboxGrid
                options={GENDER_OPTIONS}
                selected={filters.gender || []}
                onChange={(v) => set("gender", v)}
              />
            </FilterSection>
          )}

          {/* ── Age Range ── */}
          {showAge && (
            <FilterSection
              title="Age Range"
              badge={filters.ageRange ? 1 : 0}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {AGE_PRESETS.map((preset) => {
                    const isActive =
                      filters.ageRange?.min === preset.min &&
                      filters.ageRange?.max === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          set(
                            "ageRange",
                            isActive
                              ? undefined
                              : { min: preset.min, max: preset.max }
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Label className="text-xs text-muted-foreground">Custom:</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    className="h-7 w-16 text-xs"
                    value={filters.ageRange?.min ?? ""}
                    onChange={(e) =>
                      set("ageRange", {
                        ...filters.ageRange,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="h-7 w-16 text-xs"
                    value={filters.ageRange?.max ?? ""}
                    onChange={(e) =>
                      set("ageRange", {
                        ...filters.ageRange,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </FilterSection>
          )}

          {/* ── Last Login / Activity ── */}
          {showLastLogin && (
            <FilterSection
              title="Last Login"
              badge={filters.lastLoginRange ? 1 : 0}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "lastLoginDirection",
                        filters.lastLoginDirection === "within"
                          ? "not_within"
                          : "within"
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.lastLoginDirection === "within" || !filters.lastLoginDirection
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Active within
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "lastLoginDirection",
                        filters.lastLoginDirection === "not_within"
                          ? "within"
                          : "not_within"
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.lastLoginDirection === "not_within"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Not active within
                  </button>
                </div>
                <TogglePills
                  options={LAST_LOGIN_OPTIONS}
                  selected={filters.lastLoginRange}
                  onChange={(v) => set("lastLoginRange", v)}
                />
              </div>
            </FilterSection>
          )}

          {/* ── Enrollment Status ── */}
          {showEnrollment && (
            <FilterSection
              title="Enrollment Status"
              badge={
                (filters.hasEnrollments ? 1 : 0) +
                (filters.hasNoEnrollments ? 1 : 0) +
                (filters.onboardingComplete !== undefined ? 1 : 0)
              }
            >
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={filters.hasEnrollments === true}
                    onChange={(e) =>
                      set("hasEnrollments", e.target.checked ? true : undefined)
                    }
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
                  />
                  <span>Has course enrollments</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={filters.hasNoEnrollments === true}
                    onChange={(e) =>
                      set("hasNoEnrollments", e.target.checked ? true : undefined)
                    }
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
                  />
                  <span>No enrollments yet (upsell target)</span>
                </label>
                {showOnboarding && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={filters.onboardingComplete === true}
                      onChange={(e) =>
                        set(
                          "onboardingComplete",
                          e.target.checked ? true : undefined
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
                    />
                    <span>Completed onboarding</span>
                  </label>
                )}
              </div>
            </FilterSection>
          )}
        </div>

        {/* ── Count / Summary ── */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onCount}
            disabled={counting}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {counting ? "Counting..." : "Count Recipients"}
          </Button>
          {recipientCount !== null && (
            <span className="text-sm font-medium">
              {recipientCount} eligible recipient
              {recipientCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
