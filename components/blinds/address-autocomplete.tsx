"use client";

import { useState, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

export interface AddressResult {
  display_name: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  lat: number;
  lng: number;
}

interface Props {
  readonly onSelect: (result: AddressResult) => void;
  readonly placeholder?: string;
}

export function AddressAutocomplete({
  onSelect,
  placeholder = "Start typing your address…",
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function fetchSuggestions(value: string) {
    if (value.length < 4) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    fetch(`/api/address-search?q=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        setSuggestions(data ?? []);
        setOpen((data ?? []).length > 0);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 400);
  }

  function handleSelect(result: NominatimResult) {
    const { address } = result;
    const street = [address.house_number, address.road].filter(Boolean).join(" ");
    const city = address.city || address.town || address.village || "";
    const province = address.state || "";
    const postal_code = address.postcode || "";

    // Show a clean summary in the search box instead of the verbose Nominatim string
    const label = [street, city, postal_code].filter(Boolean).join(", ");
    setQuery(label || result.display_name);
    setSuggestions([]);
    setOpen(false);

    onSelect({
      display_name: result.display_name,
      street,
      city,
      province,
      postal_code,
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg text-sm overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="leading-snug">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
