"use client";

import { useState, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: {
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
    type?: string;
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

function featureLabel(f: PhotonFeature): string {
  const p = f.properties;
  const parts: string[] = [];
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  else if (p.name) parts.push(p.name);
  const city = p.city || p.town || p.village || p.suburb;
  if (city) parts.push(city);
  if (p.state) parts.push(p.state);
  if (p.postcode) parts.push(p.postcode);
  return parts.join(", ");
}

export function AddressAutocomplete({
  onSelect,
  placeholder = "Start typing your address…",
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchSuggestions(value: string) {
    if (value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    fetch(`/api/address-search?q=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((data: PhotonFeature[]) => {
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
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  }

  function handleSelect(feature: PhotonFeature) {
    const p = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;

    // Try to salvage the house number from what the user typed if Photon didn't return one
    const typedNumber = /^\d+/.exec(query)?.[0];
    const houseNumber = p.housenumber || typedNumber || "";

    const streetName = p.street || p.name || "";
    const street = houseNumber && streetName ? `${houseNumber} ${streetName}` : streetName;
    const city = p.city || p.town || p.village || p.suburb || "";
    const province = p.state || "";
    const postal_code = p.postcode || "";

    const label = featureLabel(feature);
    const displayLabel = houseNumber && streetName && !label.startsWith(houseNumber)
      ? `${houseNumber} ${label}`
      : label;

    setQuery(displayLabel);
    setSuggestions([]);
    setOpen(false);

    onSelect({ display_name: displayLabel, street, city, province, postal_code, lat, lng });
  }

  return (
    <div className="relative">
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
          {suggestions.map((f, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Photon results have no stable id
            <li key={f.properties.osm_id ?? i}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(f)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="leading-snug">{featureLabel(f)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
