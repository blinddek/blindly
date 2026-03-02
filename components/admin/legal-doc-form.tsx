"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertLegalDocument } from "@/lib/admin/legal-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LegalDocFormProps {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    required: boolean;
    active: boolean;
    version: number;
  };
}

export function LegalDocForm({ initialData }: LegalDocFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [required, setRequired] = useState(initialData?.required ?? false);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!isEditing) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Title, slug, and content are required.");
      return;
    }

    setSaving(true);
    const result = await upsertLegalDocument({
      id: initialData?.id,
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      required,
      active,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditing ? "Document updated." : "Document created.");
      router.push("/admin/legal");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/legal"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Document" : "New Document"}
          </h1>
          {isEditing && (
            <p className="mt-1 text-sm text-muted-foreground">
              Version {initialData.version} — saving will increment to v
              {initialData.version + 1}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Privacy Policy"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Slug
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="privacy"
              />
              <p className="text-xs text-muted-foreground">
                URL: /{slug || "..."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full document content here. Use blank lines between paragraphs."
              rows={20}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={required} onCheckedChange={setRequired} />
              <label className="text-sm font-medium">Required</label>
              <span className="text-xs text-muted-foreground">
                Users must accept this document
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving
            ? "Saving..."
            : isEditing
              ? "Update Document"
              : "Create Document"}
        </Button>
      </div>
    </div>
  );
}
