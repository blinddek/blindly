"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  upsertNavLink,
  deleteNavLink,
  reorderNavLinks,
} from "@/lib/cms/actions";
import type { NavLink, LocalizedString } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LocalizedInput } from "@/components/admin/localized-input";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

export default function NavLinksPage() {
  const [links, setLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLinks() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nav_links")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error(error.message);
    } else {
      setLinks(data as NavLink[]);
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate data-fetch-on-mount
  useEffect(() => { fetchLinks(); }, []);

  function handleLabelChange(id: string, value: LocalizedString) {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, label: value } : link))
    );
  }

  function handleHrefChange(id: string, value: string) {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, href: value } : link))
    );
  }

  async function handleSave(link: NavLink) {
    try {
      await upsertNavLink({
        id: link.id,
        label: link.label,
        href: link.href,
        display_order: link.display_order,
        is_active: link.is_active,
      });
      toast.success("Saved!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNavLink(id);
      setLinks((prev) => prev.filter((link) => link.id !== id));
      toast.success("Deleted!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
    }
  }

  async function handleAdd() {
    const nextOrder = links.length > 0
      ? Math.max(...links.map((l) => l.display_order)) + 1
      : 0;

    try {
      await upsertNavLink({
        label: L("New Link", "Nuwe Skakel"),
        href: "/",
        display_order: nextOrder,
        is_active: true,
      });
      toast.success("Link added!");
      await fetchLinks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add";
      toast.error(message);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === links.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...links];

    // Swap display_order values
    const tempOrder = updated[index].display_order;
    updated[index] = {
      ...updated[index],
      display_order: updated[swapIndex].display_order,
    };
    updated[swapIndex] = {
      ...updated[swapIndex],
      display_order: tempOrder,
    };

    // Re-sort
    updated.sort((a, b) => a.display_order - b.display_order);
    setLinks(updated);

    try {
      await reorderNavLinks(updated.map((l) => l.id));
      toast.success("Reordered!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reorder";
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nav Links</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nav Links</h1>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Link
        </Button>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Manage the main navigation bar links. Use arrows to reorder.
      </p>

      <div className="mt-6 space-y-3">
        {links.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No navigation links yet. Add one to get started.
          </p>
        )}

        {links.map((link, index) => (
          <Card key={link.id}>
            <CardContent className="flex flex-col gap-3">
              {/* Reorder arrows + URL row */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={index === links.length - 1}
                    onClick={() => handleMove(index, "down")}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Href */}
                <div className="flex flex-1 min-w-[180px] flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    URL
                  </label>
                  <Input
                    value={link.href}
                    onChange={(e) => handleHrefChange(link.id, e.target.value)}
                    placeholder="/about"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(link)}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(link.id)}
                    aria-label="Delete link"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Label - localized */}
              <LocalizedInput
                label="Label"
                value={link.label}
                onChange={(v) => handleLabelChange(link.id, v)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
