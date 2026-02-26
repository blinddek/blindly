"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePageSeo, createPageSeo } from "@/lib/admin/seo-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

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

function charClass(len: number, warn: number, max: number): string {
  if (len > max) return "text-destructive";
  if (len > warn) return "text-amber-600";
  return "text-muted-foreground";
}

interface SeoEditSheetProps {
  page: PageSeoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeoEditSheet({ page, open, onOpenChange }: SeoEditSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [titleEn, setTitleEn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [ogType, setOgType] = useState("website");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [priority, setPriority] = useState("0.5");
  const [changefreq, setChangefreq] = useState("monthly");

  // Reset form when page changes
  const [prevPageId, setPrevPageId] = useState<string | null>(null);
  if (page && page.id !== prevPageId) {
    setPrevPageId(page.id);
    setTitleEn(page.title?.en ?? "");
    setDescEn(page.description?.en ?? "");
    setOgImage(page.og_image_url);
    setKeywords(page.keywords ?? "");
    setOgType(page.og_type ?? "website");
    setTwitterCard(page.twitter_card ?? "summary_large_image");
    setCanonicalUrl(page.canonical_url ?? "");
    setNoindex(page.noindex ?? false);
    setPriority(String(page.priority ?? 0.5));
    setChangefreq(page.changefreq ?? "monthly");
    setSaved(false);
  }

  async function handleSave() {
    if (!page) return;
    setSaving(true);

    const data = {
      title: { en: titleEn, af: "" },
      description: { en: descEn, af: "" },
      og_image_url: ogImage,
      keywords: keywords || null,
      og_type: ogType,
      twitter_card: twitterCard,
      canonical_url: canonicalUrl || null,
      noindex,
      priority: parseFloat(priority) || 0.5,
      changefreq,
    };

    const result = page.id
      ? await updatePageSeo(page.id, data)
      : await createPageSeo({ page_key: page.page_key, ...data });

    if (result.error) {
      toast.error(result.error);
    } else {
      setSaved(true);
      router.refresh();
      setTimeout(() => {
        onOpenChange(false);
        setSaved(false);
      }, 600);
    }
    setSaving(false);
  }

  const label = page ? PAGE_LABELS[page.page_key] || page.page_key : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit SEO — {label}</SheetTitle>
        </SheetHeader>

        {page && (
          <div className="mt-6 space-y-6">
            {/* Route */}
            <div className="space-y-2">
              <Label>Page Key</Label>
              <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
                /{page.page_key === "home" ? "" : page.page_key}
              </p>
            </div>

            {/* Meta Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-title">Meta Title</Label>
                <span className={`text-xs ${charClass(titleEn.length, 55, 60)}`}>
                  {titleEn.length}/60
                </span>
              </div>
              <Input
                id="seo-title"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Page title for search engines"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-desc">Meta Description</Label>
                <span className={`text-xs ${charClass(descEn.length, 150, 160)}`}>
                  {descEn.length}/160
                </span>
              </div>
              <Textarea
                id="seo-desc"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Brief description shown in search results"
                rows={3}
              />
            </div>

            {/* OG Image */}
            <div className="space-y-2">
              <Label>OG Image</Label>
              <ImageUpload value={ogImage} onChange={setOgImage} folder="seo" />
              <p className="text-xs text-muted-foreground">
                Shown when shared on social media (1200x630 recommended).
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="seo-keywords">Keywords</Label>
              <Input
                id="seo-keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="comma, separated, keywords"
              />
            </div>

            {/* OG Type + Twitter Card */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>OG Type</Label>
                <Select value={ogType} onValueChange={setOgType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Twitter Card</Label>
                <Select value={twitterCard} onValueChange={setTwitterCard}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary_large_image">Large Image</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Canonical URL */}
            <div className="space-y-2">
              <Label htmlFor="seo-canonical">Canonical URL</Label>
              <Input
                id="seo-canonical"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://example.com/page (leave blank for auto)"
              />
            </div>

            {/* Priority + Change Frequency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sitemap Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.0">1.0 (Highest)</SelectItem>
                    <SelectItem value="0.8">0.8 (High)</SelectItem>
                    <SelectItem value="0.5">0.5 (Normal)</SelectItem>
                    <SelectItem value="0.3">0.3 (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Change Frequency</Label>
                <Select value={changefreq} onValueChange={setChangefreq}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Noindex */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Noindex</Label>
                <p className="text-xs text-muted-foreground">
                  Hide this page from search engines
                </p>
              </div>
              <Switch checked={noindex} onCheckedChange={setNoindex} />
            </div>

            {/* Preview Cards */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preview</Label>

              {/* Google Preview */}
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground">Google Search</p>
                <p className="mt-1 truncate text-sm text-blue-600">
                  {titleEn || "Page Title"}
                </p>
                <p className="truncate text-xs text-green-700">
                  {canonicalUrl || `example.com/${page.page_key === "home" ? "" : page.page_key}`}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {descEn || "Page description will appear here..."}
                </p>
              </div>

              {/* Social Preview */}
              <div className="overflow-hidden rounded-md border">
                {ogImage ? (
                  <div className="aspect-[1200/630] w-full bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogImage}
                      alt="OG preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[1200/630] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                    No OG image set
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Facebook / Twitter Preview
                  </p>
                  <p className="mt-1 truncate text-sm font-medium">
                    {titleEn || "Page Title"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {descEn || "Page description will appear here..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Save */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="mr-2 h-4 w-4" />
              ) : null}
              {saved ? "Saved" : "Save Changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
