# Build 28 — Room Preview (Stretch Goal)

> **Type:** Frontend
> **Estimated Time:** 3–4 hrs
> **Dependencies:** Build 15 (configurator)
> **Context Files:** PROJECT_BRIEF.md §3 (Step 8 mention)

---

## Objective

**STRETCH GOAL** — only build if time/budget allows. Create a room preview feature where customers can upload a photo of their room, select their window area, and see a semi-transparent overlay of their chosen blind colour. This is a "wow" feature that increases conversion confidence.

---

## Context

This is NOT a photorealistic rendering engine. It's a simple overlay:
1. Customer uploads a photo of their room
2. They draw a rectangle over their window
3. A semi-transparent colour overlay (matching their selected blind colour) is placed within that rectangle
4. Optionally, a texture pattern overlay for the blind type (horizontal slats for venetian, vertical louvres for vertical, smooth for roller)

The value is emotional — "I can see what this will look like in my space" — not photographic accuracy.

---

## Tasks

### 1. Room Preview Component

**`src/components/configurator/room-preview.tsx`**

Accessible from:
- The configurator after colour selection (Step 5)
- The cart page as a "Preview in your room" option per item

### 2. Photo Upload

- Drag & drop or click to upload
- Accept: JPEG, PNG, WebP
- Max size: 5MB
- Resize client-side if > 2000px wide (performance)
- Show uploaded photo in a canvas element
- No server upload needed — all processing client-side

### 3. Window Selection

After upload, user selects the window area:
- Click and drag to draw a rectangle on the photo
- Resizable handles on corners and edges
- Perspective-aware: optional trapezoid mode for angled windows (nice to have, not required)
- Show dimension guide: "Drag to select your window area"

### 4. Blind Overlay

Once window area selected, apply overlay:

**Roller Blinds:**
- Solid colour fill at 70% opacity
- Subtle horizontal line pattern (for fabric texture)
- Small headrail rectangle at the top (5% of height)

**Venetian Blinds (Aluminium/Wood):**
- Horizontal slat pattern (alternating colour/shadow stripes)
- Slat width proportional to actual slat size (25mm vs 50mm)
- Slight shadow between slats for depth

**Vertical Blinds:**
- Vertical stripe pattern (alternating colour/shadow)
- Louvre width proportional to slat size (90mm vs 127mm)

### 5. Colour Application

- Fill colour: from the selected colour's hex value
- Opacity: 70% (allows the room photo to show through)
- Shadow: subtle inner shadow for depth
- The overlay should blend reasonably with the photo

### 6. Controls

Below the preview:
- "Change Photo" button
- "Adjust Window" button (re-enter selection mode)
- "Download Preview" button (save canvas as PNG)
- Colour hex display + name

### 7. Save to Order (Optional)

If the customer likes their preview:
- Save the canvas as a PNG
- Upload to Supabase Storage
- Store URL in the cart item's `room_preview_image_url`
- Visible in the admin order detail

### 8. Performance

- All processing is client-side (Canvas API)
- No server calls needed for the preview
- Keep the canvas rendering smooth (requestAnimationFrame for drag operations)
- Test on mobile (touch events for window selection)

---

## Implementation Approach

Use HTML5 Canvas:

```typescript
const canvas = useRef<HTMLCanvasElement>(null)

function drawPreview() {
  const ctx = canvas.current.getContext('2d')
  
  // Draw photo
  ctx.drawImage(photo, 0, 0, canvasWidth, canvasHeight)
  
  // Draw blind overlay within selection rectangle
  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = selectedColourHex
  
  if (blindType === 'roller') {
    drawRollerOverlay(ctx, selection)
  } else if (blindType === 'venetian') {
    drawVenetianOverlay(ctx, selection, slatSize)
  } else if (blindType === 'vertical') {
    drawVerticalOverlay(ctx, selection, slatSize)
  }
  
  ctx.restore()
}
```

---

## Acceptance Criteria

```
✅ Photo upload works (JPEG, PNG, WebP up to 5MB)
✅ Client-side resize for large images
✅ Rectangle selection tool works on the photo
✅ Selection is resizable via corner/edge handles
✅ Correct blind type overlay renders (roller/venetian/vertical)
✅ Selected colour hex applied with appropriate opacity
✅ Slat pattern varies by slat size (25mm vs 50mm vs 127mm)
✅ Download preview as PNG works
✅ Works on mobile (touch events)
✅ No server calls — all client-side
✅ Performance: smooth drag, no frame drops
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- This is a STRETCH GOAL — skip if behind schedule
- Keep it simple: rectangle selection + colour overlay. Don't try to do perspective correction or photorealistic rendering.
- Canvas API is the right tool — no need for WebGL or Three.js
- The overlay patterns (slats, louvres) can be simple CSS-like stripes drawn on canvas
- Mobile support is important but can be basic (touch start/move/end for selection)
- If time is very tight, a simplified version that just shows a colour swatch next to the room photo (no overlay) still adds value
