"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateSiteSettings } from "@/lib/admin/actions";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/admin/user-actions";
import type { SiteSettings, LocalizedString } from "@/types/cms";
import { SettingsLayout } from "@/components/admin/settings-layout";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LocalizedInput } from "@/components/admin/localized-input";
import { BusinessHoursEditor } from "@/components/admin/business-hours-editor";
import { toast } from "sonner";
import {
  Save,
  Building2,
  Phone,
  MapPin,
  Share2,
  MousePointerClick,
  Users,
  Plus,
  Trash2,
  Pencil,
  Receipt,
} from "lucide-react";
import { updateShopSetting } from "@/lib/shop/actions";

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

const tabs = [
  { key: "branding", label: "Branding", icon: Building2 },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "maps", label: "Maps", icon: MapPin },
  { key: "social", label: "Social", icon: Share2 },
  { key: "header", label: "Header", icon: MousePointerClick },
  { key: "finance", label: "Finance", icon: Receipt },
  { key: "users", label: "Users", icon: Users },
];

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
    <SettingsLayout
      title="Site Settings"
      description="Business identity, contact details, and integrations."
      tabs={tabs}
      onSave={handleSave}
      saving={saving}
    >
      {(activeTab) => (
        <>
          {activeTab === "branding" && (
            <div className="space-y-6">
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
              <SaveButton onSave={handleSave} saving={saving} />
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-6">
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
              <SaveButton onSave={handleSave} saving={saving} />
            </div>
          )}

          {activeTab === "maps" && (
            <div className="space-y-6">
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
              <SaveButton onSave={handleSave} saving={saving} />
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-6">
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
              <SaveButton onSave={handleSave} saving={saving} />
            </div>
          )}

          {activeTab === "header" && (
            <div className="space-y-6">
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
              <SaveButton onSave={handleSave} saving={saving} />
            </div>
          )}

          {activeTab === "finance" && <FinancePanel />}

          {activeTab === "users" && <UsersPanel />}
        </>
      )}
    </SettingsLayout>
  );
}

/* ── Finance Panel ── */

function FinancePanel() {
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("shop_settings").select("key, value").eq("key", "tax_rate_percent");
      if (data && data.length > 0) {
        setVatRate(Number(data[0].value) || 15);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateShopSetting("tax_rate_percent", vatRate);
      toast.success("Finance settings saved.");
    } catch {
      toast.error("Failed to save.");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VAT Configuration</CardTitle>
          <CardDescription>Value-added tax applied to all orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">VAT Rate (%)</label>
            <Input
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              placeholder="15"
              className="max-w-32"
            />
            <p className="text-xs text-muted-foreground">
              Standard SA VAT is 15%. Set to 0 if not VAT registered.
            </p>
          </div>
        </CardContent>
      </Card>
      <SaveButton onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ── Users Panel ── */

interface UserRow {
  id: string;
  role: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", role: "admin" as "admin" | "customer" });
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data as UserRow[]);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users. Please refresh.");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast.error("All fields are required.");
      return;
    }
    setCreating(true);
    const result = await createUser(newUser);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User created.");
      setCreateOpen(false);
      setNewUser({ email: "", password: "", fullName: "", role: "admin" });
      load();
    }
    setCreating(false);
  }

  function openEdit(user: UserRow) {
    setEditUser(user);
    setEditName(user.full_name || "");
    setEditPassword("");
  }

  async function handleEdit() {
    if (!editUser) return;
    if (!editName.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    const result = await updateUser(editUser.id, {
      fullName: editName.trim(),
      password: editPassword || undefined,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User updated.");
      setEditUser(null);
      load();
    }
    setSaving(false);
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) return;
    const result = await deleteUser(user.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User deleted.");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground">Manage admin accounts.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Field label="Full Name" value={newUser.fullName} onChange={(v) => setNewUser((p) => ({ ...p, fullName: v }))} placeholder="John Smith" />
              <Field label="Email" value={newUser.email} onChange={(v) => setNewUser((p) => ({ ...p, email: v }))} placeholder="john@example.com" />
              <Field label="Password" value={newUser.password} onChange={(v) => setNewUser((p) => ({ ...p, password: v }))} placeholder="Minimum 6 characters" />
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit user dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={editUser.email || ""} disabled className="bg-muted" />
              </div>
              <Field label="Full Name" value={editName} onChange={setEditName} placeholder="Full name" />
              <Field label="New Password" value={editPassword} onChange={setEditPassword} placeholder="Leave blank to keep current" hint="Only fill in if you want to change the password" />
              <Button onClick={handleEdit} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No users found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{user.full_name || "—"}</span>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email} &middot; Joined{" "}
                    {new Date(user.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(user)}
                    title="Edit user"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared helpers ── */

function SaveButton({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="hidden md:flex justify-end">
      <Button onClick={onSave} disabled={saving} size="lg">
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
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
