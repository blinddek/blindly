"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Plus } from "lucide-react";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  bucket?: string;
  label?: string;
}

/**
 * Multi-image upload — uploads to Supabase Storage (gallery bucket).
 * Displays a grid of thumbnails with remove buttons + an add button.
 */
export function MultiImageUpload({
  value,
  onChange,
  folder = "images",
  bucket = "uploads",
  label = "Gallery Images",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function removeImage(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      formData.set("bucket", bucket);

      const result = await uploadFile(formData);

      if ("error" in result) {
        setError(result.error);
        break;
      } else {
        newUrls.push(result.url);
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-square">
              <Image
                src={url}
                alt={`Gallery image ${i + 1}`}
                fill
                sizes="120px"
                className="rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : value.length === 0 ? (
            <Upload className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Uploading..." : value.length === 0 ? "Upload Images" : "Add More"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
