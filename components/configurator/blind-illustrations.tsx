"use client";

import { cn } from "@/lib/utils";

/* ─── Shared Types & Constants ────────────────────────────── */

interface BlindIllustrationProps {
  colour?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "w-12 h-16",
  md: "w-20 h-[6.5rem]",
  lg: "w-30 h-40",
} as const;

const HW = "#8B8178"; // Neutral warm grey for brackets/rails/hardware

/* ─── Roller Blind ────────────────────────────────────────── */

export function RollerBlindIllustration({
  colour = "currentColor",
  className,
  size = "md",
}: BlindIllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(SIZES[size], className)}
      aria-hidden="true"
    >
      {/* Mounting brackets */}
      <rect x="15" y="8" width="8" height="12" rx="1" stroke={HW} strokeWidth="1.5" />
      <rect x="97" y="8" width="8" height="12" rx="1" stroke={HW} strokeWidth="1.5" />

      {/* Roller tube */}
      <rect x="18" y="12" width="84" height="10" rx="5" stroke={HW} strokeWidth="1.5" />

      {/* Fabric body */}
      <path d="M20 22 L20 140 Q60 146 100 140 L100 22" stroke={colour} strokeWidth="1.5" />

      {/* Fabric fold lines */}
      <line x1="24" y1="50" x2="96" y2="50" stroke={colour} strokeWidth="0.5" opacity="0.3" />
      <line x1="24" y1="80" x2="96" y2="80" stroke={colour} strokeWidth="0.5" opacity="0.3" />
      <line x1="24" y1="110" x2="96" y2="110" stroke={colour} strokeWidth="0.5" opacity="0.3" />

      {/* Weighted hem */}
      <path d="M20 140 Q60 146 100 140" stroke={colour} strokeWidth="2" />

      {/* Pull chain */}
      <circle cx="104" cy="28" r="2" stroke={HW} strokeWidth="1" />
      <line x1="104" y1="30" x2="104" y2="80" stroke={HW} strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="104" cy="82" r="3" stroke={HW} strokeWidth="1" />
    </svg>
  );
}

/* ─── Aluminium Venetian ──────────────────────────────────── */

export function AluminiumVenetianIllustration({
  colour = "currentColor",
  className,
  size = "md",
}: BlindIllustrationProps) {
  const slatCount = 9;
  const startY = 30;
  const spacing = 13;
  const tilt = 3;

  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(SIZES[size], className)}
      aria-hidden="true"
    >
      {/* Headrail */}
      <rect x="15" y="10" width="90" height="10" rx="2" stroke={HW} strokeWidth="1.5" />

      {/* Ladder strings */}
      <line x1="30" y1="20" x2="30" y2="148" stroke={HW} strokeWidth="0.75" opacity="0.5" />
      <line x1="90" y1="20" x2="90" y2="148" stroke={HW} strokeWidth="0.75" opacity="0.5" />

      {/* Slats */}
      {Array.from({ length: slatCount }, (_, i) => {
        const y = startY + i * spacing;
        return (
          <line
            key={i}
            x1="18"
            y1={y - tilt}
            x2="102"
            y2={y + tilt}
            stroke={colour}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}

      {/* Bottom rail */}
      <rect x="18" y="148" width="84" height="5" rx="1.5" stroke={colour} strokeWidth="1.5" />

      {/* Tilt wand */}
      <line x1="16" y1="18" x2="16" y2="90" stroke={HW} strokeWidth="1" />
      <circle cx="16" cy="92" r="2.5" stroke={HW} strokeWidth="1" />
    </svg>
  );
}

/* ─── Wood Venetian ───────────────────────────────────────── */

export function WoodVenetianIllustration({
  colour = "currentColor",
  className,
  size = "md",
}: BlindIllustrationProps) {
  const slatCount = 6;
  const startY = 32;
  const spacing = 19;
  const h = 6;
  const tilt = 2;

  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(SIZES[size], className)}
      aria-hidden="true"
    >
      {/* Headrail */}
      <rect x="15" y="10" width="90" height="12" rx="2" stroke={HW} strokeWidth="1.5" />

      {/* Ladder strings */}
      <line x1="32" y1="22" x2="32" y2="150" stroke={HW} strokeWidth="0.75" opacity="0.5" />
      <line x1="88" y1="22" x2="88" y2="150" stroke={HW} strokeWidth="0.75" opacity="0.5" />

      {/* Thick slats with woodgrain */}
      {Array.from({ length: slatCount }, (_, i) => {
        const y = startY + i * spacing;
        const cx = 60;
        const cy = y + h / 2;
        return (
          <g key={i}>
            <rect
              x="18" y={y} width="84" height={h} rx="1"
              stroke={colour} strokeWidth="1.5"
              transform={`rotate(${tilt}, ${cx}, ${cy})`}
            />
            {/* Grain lines */}
            <line
              x1="25" y1={y + 2} x2="95" y2={y + 2}
              stroke={colour} strokeWidth="0.4" opacity="0.25"
              transform={`rotate(${tilt}, ${cx}, ${cy})`}
            />
            <line
              x1="30" y1={y + 4} x2="90" y2={y + 4}
              stroke={colour} strokeWidth="0.3" opacity="0.2"
              transform={`rotate(${tilt}, ${cx}, ${cy})`}
            />
          </g>
        );
      })}

      {/* Bottom rail */}
      <rect x="18" y="148" width="84" height="6" rx="2" stroke={colour} strokeWidth="1.5" />

      {/* Tilt wand */}
      <line x1="16" y1="20" x2="16" y2="85" stroke={HW} strokeWidth="1" />
      <circle cx="16" cy="87" r="2.5" stroke={HW} strokeWidth="1" />
    </svg>
  );
}

/* ─── Vertical Blind ──────────────────────────────────────── */

export function VerticalBlindIllustration({
  colour = "currentColor",
  className,
  size = "md",
}: BlindIllustrationProps) {
  const vaneCount = 7;
  const startX = 18;
  const vaneWidth = 12;
  const gap = 1;
  const rotation = 5;

  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(SIZES[size], className)}
      aria-hidden="true"
    >
      {/* Headrail */}
      <rect x="10" y="10" width="100" height="8" rx="2" stroke={HW} strokeWidth="1.5" />

      {/* Carrier dots */}
      {Array.from({ length: vaneCount }, (_, i) => (
        <circle
          key={`c-${i}`}
          cx={startX + i * (vaneWidth + gap) + vaneWidth / 2}
          cy="14"
          r="1.5"
          stroke={HW}
          strokeWidth="0.75"
        />
      ))}

      {/* Vertical vanes */}
      {Array.from({ length: vaneCount }, (_, i) => {
        const x = startX + i * (vaneWidth + gap);
        const cx = x + vaneWidth / 2;
        return (
          <g key={`v-${i}`}>
            <rect
              x={x} y="18" width={vaneWidth} height="130" rx="0.5"
              stroke={colour} strokeWidth="1"
              transform={`rotate(${rotation}, ${cx}, 83)`}
            />
            <line
              x1={cx} y1="25" x2={cx} y2="140"
              stroke={colour} strokeWidth="0.3" opacity="0.2"
              transform={`rotate(${rotation}, ${cx}, 83)`}
            />
          </g>
        );
      })}

      {/* Chain cord */}
      <line x1="108" y1="16" x2="108" y2="50" stroke={HW} strokeWidth="0.75" strokeDasharray="2 2" />
      <circle cx="108" cy="52" r="2" stroke={HW} strokeWidth="0.75" />
    </svg>
  );
}

/* ─── Dispatcher ──────────────────────────────────────────── */

const ILLUSTRATION_MAP: Record<string, React.ComponentType<BlindIllustrationProps>> = {
  roller: RollerBlindIllustration,
  "aluminium-venetian": AluminiumVenetianIllustration,
  "wood-venetian": WoodVenetianIllustration,
  vertical: VerticalBlindIllustration,
};

export function BlindIllustration({
  categorySlug,
  ...props
}: BlindIllustrationProps & { categorySlug: string }) {
  const Component = ILLUSTRATION_MAP[categorySlug];
  if (!Component) return null;
  return <Component {...props} />;
}

/* ─── Material Texture Mapping ────────────────────────────── */

export type MaterialTexture = "fabric" | "aluminium" | "wood" | "smooth";

export function getMaterialType(categorySlug: string): MaterialTexture {
  switch (categorySlug) {
    case "roller":
    case "vertical":
      return "fabric";
    case "aluminium-venetian":
      return "aluminium";
    case "wood-venetian":
      return "wood";
    default:
      return "smooth";
  }
}

/* ─── Swatch Texture Pattern Defs ─────────────────────────── */

/**
 * Render once in a component tree to make SVG pattern IDs available.
 * Patterns: texture-fabric, texture-aluminium, texture-wood, texture-smooth
 */
export function SwatchTextureDefs() {
  return (
    <svg className="absolute size-0" aria-hidden="true">
      <defs>
        {/* Fabric — subtle woven crosshatch */}
        <pattern id="texture-fabric" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="4" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
          <line x1="4" y1="0" x2="0" y2="4" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
        </pattern>

        {/* Aluminium — horizontal brushed lines */}
        <pattern id="texture-aluminium" x="0" y="0" width="6" height="2" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1" x2="6" y2="1" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        </pattern>

        {/* Wood — organic grain curves */}
        <pattern id="texture-wood" x="0" y="0" width="8" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3 Q2 2 4 3 Q6 4 8 3" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" fill="none" />
          <path d="M0 5 Q2 4.5 4 5.5 Q6 6 8 5" stroke="rgba(0,0,0,0.05)" strokeWidth="0.4" fill="none" />
        </pattern>

        {/* Smooth — subtle diagonal sheen (PVC, polywood) */}
        <pattern id="texture-smooth" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="10" y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        </pattern>
      </defs>
    </svg>
  );
}

/* ─── Colour Swatch Component ─────────────────────────────── */

interface ColourSwatchProps {
  hex: string;
  name: string;
  materialType: MaterialTexture;
  selected?: boolean;
  size?: "sm" | "lg";
}

export function ColourSwatch({
  hex,
  name,
  materialType,
  selected,
  size = "lg",
}: ColourSwatchProps) {
  const isLarge = size === "lg";

  return (
    <span
      title={name}
      className={cn(
        "relative inline-block overflow-hidden rounded-full border-2 shadow-sm transition-all",
        isLarge ? "size-14" : "size-5",
        selected
          ? "border-primary ring-2 ring-primary/30 scale-110"
          : "border-border/50",
      )}
    >
      {/* Base colour */}
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: hex }} />
      {/* Texture overlay */}
      <svg className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="50%" cy="50%" r="50%" fill={`url(#texture-${materialType})`} />
      </svg>
    </span>
  );
}
