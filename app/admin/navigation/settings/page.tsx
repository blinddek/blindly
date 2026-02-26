"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateSiteContent } from "@/lib/cms/actions";
import type { SiteSettings, LocalizedString } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LocalizedInput } from "@/components/admin/localized-input";
import { toast } from "sonner";
import { Save } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

const defaultSettings: SiteSettings = {
  logo_text: "",
  company_name: "",
  company_tagline: L(),
  login_label: L(),
  login_url: "",
  cta_label: L(),
  cta_url: "",
};

export default function SiteSettingsPage() {
  const [form, setForm] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "site_settings")
        .single();

      if (error) {
        toast.error(error.message);
      } else if (data?.content) {
        setForm({ ...defaultSettings, ...(data.content as SiteSettings) });
      }
      setLoading(false);
    }

    fetchSettings();
  }, []);

  function handleStringChange(key: "logo_text" | "company_name" | "registration_number" | "login_url" | "cta_url", value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleLocalizedChange(key: "company_tagline" | "login_label" | "cta_label", value: LocalizedString) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSiteContent(
        "site_settings",
        form as unknown as Record<string, unknown>
      );
      toast.success("Saved!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Global site identity and header button configuration.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            These values are used across the entire site for branding and
            navigation.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plain string fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="logo_text"
                className="text-sm font-medium text-foreground"
              >
                Logo Text
              </label>
              <Input
                id="logo_text"
                value={form.logo_text}
                onChange={(e) => handleStringChange("logo_text", e.target.value)}
                placeholder="Your Brand"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="company_name"
                className="text-sm font-medium text-foreground"
              >
                Company Name
              </label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => handleStringChange("company_name", e.target.value)}
                placeholder="Your Company"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="registration_number"
              className="text-sm font-medium text-foreground"
            >
              Registration Number
            </label>
            <Input
              id="registration_number"
              value={form.registration_number ?? ""}
              onChange={(e) => handleStringChange("registration_number", e.target.value)}
              placeholder="2024/123456/07"
            />
            <p className="text-xs text-muted-foreground">
              Displayed in the site footer.
            </p>
          </div>

          {/* Localized fields */}
          <LocalizedInput
            label="Company Tagline"
            value={form.company_tagline}
            onChange={(v) => handleLocalizedChange("company_tagline", v)}
            placeholder="We build great things"
          />

          <LocalizedInput
            label="Login Label"
            value={form.login_label}
            onChange={(v) => handleLocalizedChange("login_label", v)}
            placeholder="Log In"
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login_url"
              className="text-sm font-medium text-foreground"
            >
              Login URL
            </label>
            <Input
              id="login_url"
              value={form.login_url}
              onChange={(e) => handleStringChange("login_url", e.target.value)}
              placeholder="/login"
            />
          </div>

          <LocalizedInput
            label="CTA Label"
            value={form.cta_label}
            onChange={(v) => handleLocalizedChange("cta_label", v)}
            placeholder="Get Started"
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cta_url"
              className="text-sm font-medium text-foreground"
            >
              CTA URL
            </label>
            <Input
              id="cta_url"
              value={form.cta_url}
              onChange={(e) => handleStringChange("cta_url", e.target.value)}
              placeholder="/get-started"
            />
          </div>

          <div className="mt-6">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
