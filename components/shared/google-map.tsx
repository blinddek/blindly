"use client";

interface GoogleMapProps {
  embedUrl: string;
  title?: string;
}

/**
 * Lazy-loaded, responsive Google Maps embed.
 * Uses the embed URL from site_settings.
 */
export function GoogleMap({ embedUrl, title = "Location" }: GoogleMapProps) {
  if (!embedUrl) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border">
      <iframe
        src={embedUrl}
        title={title}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
