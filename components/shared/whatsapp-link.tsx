import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

interface WhatsAppLinkProps {
  phoneNumber: string;
  label?: string;
  className?: string;
}

/**
 * Inline WhatsApp link for contact page and CTAs.
 */
export function WhatsAppLink({
  phoneNumber,
  label = "Chat on WhatsApp",
  className,
}: WhatsAppLinkProps) {
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
      className={`inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1da851] ${className ?? ""}`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
