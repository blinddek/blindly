"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface DynamicStringListProps {
  value: string[];
  onChange: (newList: string[]) => void;
  placeholder?: string;
}

export function DynamicStringList({
  value,
  onChange,
  placeholder = "Enter a value",
}: DynamicStringListProps) {
  function handleChange(index: number, text: string) {
    const updated = [...value];
    updated[index] = text;
    onChange(updated);
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleAdd() {
    onChange([...value, ""]);
  }

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(index)}
            aria-label="Remove item"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
      >
        <Plus className="size-4" />
        Add item
      </Button>
    </div>
  );
}
