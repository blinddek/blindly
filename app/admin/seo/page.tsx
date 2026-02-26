"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SeoEditSheet } from "@/components/admin/seo-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Search, ImageOff, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PageSeoRow {
  id: string;
  page_key: string;
  title: { en: string; af: string } | null;
  description: { en: string; af: string } | null;
  og_image_url: string | null;
  keywords: string | null;
  og_type: string | null;
  twitter_card: string | null;
  canonical_url: string | null;
  noindex: boolean;
  priority: number | null;
  changefreq: string | null;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  services: "Services",
  contact: "Contact",
  faq: "FAQ",
  terms: "Terms",
  privacy: "Privacy",
  blog: "Blog",
  portfolio: "Portfolio",
  shop: "Shop",
  book: "Booking",
  courses: "Courses",
};

type FilterType = "all" | "missing_image" | "missing_description" | "noindex";

type SeoStatus = "complete" | "partial" | "missing";

function getStatus(page: PageSeoRow): SeoStatus {
  const hasTitle = !!page.title?.en;
  const hasDesc = !!page.description?.en;
  const hasImage = !!page.og_image_url;
  if (hasTitle && hasDesc && hasImage) return "complete";
  if (hasTitle || hasDesc) return "partial";
  return "missing";
}

export default function AdminSeoPage() {
  const [pages, setPages] = useState<PageSeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [editing, setEditing] = useState<PageSeoRow | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("page_seo")
        .select("*")
        .order("page_key");
      setPages((data as PageSeoRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = pages.filter((p) => {
    const label = PAGE_LABELS[p.page_key] || p.page_key;
    if (search && !label.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "missing_image" && p.og_image_url) return false;
    if (filter === "missing_description" && p.description?.en) return false;
    if (filter === "noindex" && !p.noindex) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Management</h1>
        <p className="mt-1 text-muted-foreground">
          Manage meta titles, descriptions, OG images, and structured data for every page.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="missing_image">Missing OG Image</SelectItem>
            <SelectItem value="missing_description">Missing Description</SelectItem>
            <SelectItem value="noindex">Noindexed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{pages.filter((p) => getStatus(p) === "complete").length}</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pages.filter((p) => getStatus(p) === "partial").length}</p>
              <p className="text-xs text-muted-foreground">Partial</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <ImageOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{pages.filter((p) => !p.og_image_url).length}</p>
              <p className="text-xs text-muted-foreground">Missing OG Image</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Page List */}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No pages found.</p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((page) => (
            <SeoPageCard
              key={page.id}
              page={page}
              onEdit={() => setEditing(page)}
            />
          ))}
        </div>
      )}

      <SeoEditSheet
        page={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}

function getBadgeVariant(status: SeoStatus) {
  if (status === "complete") return "default" as const;
  if (status === "partial") return "secondary" as const;
  return "outline" as const;
}

function getStatusLabel(status: SeoStatus) {
  if (status === "complete") return "Complete";
  if (status === "partial") return "Partial";
  return "Not Set";
}

function truncateDescription(desc: string | undefined | null): string {
  if (!desc) return "No description";
  return desc.length > 100 ? `${desc.substring(0, 100)}...` : desc;
}

function SeoPageCard({ page, onEdit }: { page: PageSeoRow; onEdit: () => void }) {
  const status = getStatus(page);
  const label = PAGE_LABELS[page.page_key] || page.page_key;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            <Badge variant={getBadgeVariant(status)}>
              {getStatusLabel(status)}
            </Badge>
            {page.noindex && (
              <Badge variant="destructive">Noindex</Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {page.title?.en || <span className="italic">No title set</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {truncateDescription(page.description?.en)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="ml-2 shrink-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
