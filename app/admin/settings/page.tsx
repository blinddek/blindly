"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateSiteSettings } from "@/lib/admin/actions";
import type { SiteSettings, LocalizedString } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LocalizedInput } from "@/components/admin/localized-input";
import { BusinessHoursEditor } from "@/components/admin/business-hours-editor";
import { toast } from "sonner";
import { Save } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

const defaultSettings: SiteSettings = {
  logo_text: "",
  company_name: "",
  company_tagline: L(),
  login_label: L("Login", "Teken In"),
  login_url: "/login",
  cta_label: L("Contact Us", "Kontak Ons"),
  cta_url: "/contact",
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

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setLocalized(key: string, value: LocalizedString) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateSiteSettings(
      form as unknown as Record<string, unknown>
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved.");
    }
    setSaving(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Business identity, contact details, and integrations.
        </p>
      </div>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Logo, name, and tagline displayed across the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo Text" value={form.logo_text} onChange={(v) => set("logo_text", v)} placeholder="Your Brand" />
            <Field label="Company Name" value={form.company_name} onChange={(v) => set("company_name", v)} placeholder="Your Company (Pty) Ltd" />
          </div>
          <LocalizedInput label="Company Tagline" value={form.company_tagline} onChange={(v) => setLocalized("company_tagline", v)} placeholder="We build great things" />
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>Displayed on the contact page, footer, and structured data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={form.email ?? ""} onChange={(v) => set("email", v)} placeholder="info@example.com" />
            <Field label="Phone" value={form.phone_number ?? ""} onChange={(v) => set("phone_number", v)} placeholder="+27 12 345 6789" />
          </div>
          <Field label="WhatsApp Number" value={form.whatsapp_number ?? ""} onChange={(v) => set("whatsapp_number", v)} placeholder="27123456789" hint="International format without + (used for wa.me link)" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-address" className="text-sm font-medium text-foreground">Address</label>
            <Textarea
              id="settings-address"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Main Street, City, 1234"
              rows={2}
            />
          </div>
          <BusinessHoursEditor
            value={form.business_hours}
            onChange={(schedule) => setForm((prev) => ({ ...prev, business_hours: schedule }))}
          />
        </CardContent>
      </Card>

      {/* Google Maps */}
      <Card>
        <CardHeader>
          <CardTitle>Google Maps</CardTitle>
          <CardDescription>Map embed for the contact page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Google Maps Embed URL" value={form.google_maps_url ?? ""} onChange={(v) => set("google_maps_url", v)} placeholder="https://www.google.com/maps/embed?pb=..." hint="Paste the embed URL from Google Maps" />
          <Field label="Coordinates" value={form.coordinates ?? ""} onChange={(v) => set("coordinates", v)} placeholder="-33.9249, 18.4241" hint="Latitude, longitude for structured data" />
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Displayed in the footer and structured data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
            { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
            { key: "social_twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
            { key: "social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
            { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
            { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
          ].map(({ key, label, placeholder }) => (
            <Field
              key={key}
              label={label}
              value={(form as unknown as Record<string, string>)[key] ?? ""}
              onChange={(v) => set(key, v)}
              placeholder={placeholder}
            />
          ))}
        </CardContent>
      </Card>

      {/* Header Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Header Buttons</CardTitle>
          <CardDescription>Login and CTA button in the navbar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedInput label="Login Label" value={form.login_label} onChange={(v) => setLocalized("login_label", v)} placeholder="Login" />
          <Field label="Login URL" value={form.login_url} onChange={(v) => set("login_url", v)} placeholder="/login" />
          <LocalizedInput label="CTA Label" value={form.cta_label} onChange={(v) => setLocalized("cta_label", v)} placeholder="Contact Us" />
          <Field label="CTA URL" value={form.cta_url} onChange={(v) => set("cta_url", v)} placeholder="/contact" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
