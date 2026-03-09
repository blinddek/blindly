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
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const L = (en = "", af = ""): LocalizedString => ({ en, af });

// ── Sortable row ──────────────────────────────────────────────────────────────

interface RowProps {
  link: NavLink;
  index: number;
  total: number;
  onLabelChange: (id: string, v: LocalizedString) => void;
  onHrefChange: (id: string, v: string) => void;
  onHideToggle: (id: string) => void;
  onSave: (link: NavLink) => void;
  onDelete: (id: string) => void;
}

function SortableNavLinkRow({
  link,
  onLabelChange,
  onHrefChange,
  onHideToggle,
  onSave,
  onDelete,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="flex flex-col gap-3">
          {/* Drag handle + URL row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Href */}
            <div className="flex flex-1 min-w-[180px] flex-col gap-1">
              <label htmlFor={`href-${link.id}`} className="text-xs font-medium text-muted-foreground">
                URL
              </label>
              <Input
                id={`href-${link.id}`}
                value={link.href}
                onChange={(e) => onHrefChange(link.id, e.target.value)}
                placeholder="/about"
              />
            </div>

            {/* Hide in nav toggle */}
            <div className="flex flex-col items-center gap-1 pt-5">
              <label htmlFor={`hide-${link.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                Hide in nav
              </label>
              <button
                id={`hide-${link.id}`}
                type="button"
                role="switch"
                aria-checked={link.hide_in_nav}
                onClick={() => onHideToggle(link.id)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  link.hide_in_nav ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    link.hide_in_nav ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave(link)}
              >
                <Save className="mr-1 h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(link.id)}
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
            onChange={(v) => onLabelChange(link.id, v)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NavLinksPage() {
  const [links, setLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

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

  function handleHideToggle(id: string) {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, hide_in_nav: !link.hide_in_nav } : link
      )
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
        hide_in_nav: link.hide_in_nav,
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered);

    try {
      await reorderNavLinks(reordered.map((l) => l.id));
      toast.success("Reordered!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reorder";
      toast.error(message);
      await fetchLinks(); // revert
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
        Manage the main navigation bar links. Drag to reorder.
      </p>

      <div className="mt-6 space-y-3">
        {links.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No navigation links yet. Add one to get started.
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {links.map((link, index) => (
              <SortableNavLinkRow
                key={link.id}
                link={link}
                index={index}
                total={links.length}
                onLabelChange={handleLabelChange}
                onHrefChange={handleHrefChange}
                onHideToggle={handleHideToggle}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
