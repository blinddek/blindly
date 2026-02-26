"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

interface WhatsAppButtonProps {
  phoneNumber: string;
}

/**
 * Floating WhatsApp button — bottom-right, green.
 * Pre-filled message with site name.
 */
export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  if (!phoneNumber) return null;

  const message = encodeURIComponent(
    `Hi, I found you on ${siteConfig.name} and would like to get in touch.`
  );
  const href = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:ring-offset-2"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
