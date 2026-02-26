"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LocalizedString } from "@/types/cms";

interface LocalizedStringListProps {
  label: string;
  items: LocalizedString[];
  onChange: (items: LocalizedString[]) => void;
}

export function LocalizedStringList({ label, items, onChange }: LocalizedStringListProps) {
  function addItem() {
    onChange([...items, { en: "", af: "" }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, value: LocalizedString) {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <Input
              value={item.en}
              onChange={(e) => updateItem(i, { ...item, en: e.target.value })}
              placeholder="English"
            />
            <Input
              value={item.af}
              onChange={(e) => updateItem(i, { ...item, af: e.target.value })}
              placeholder="Afrikaans"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1 h-4 w-4" /> Add Item
      </Button>
    </div>
  );
}
