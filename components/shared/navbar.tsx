"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSelector } from "@/components/shared/language-selector";
import { NavbarAuthButton } from "@/components/shared/navbar-auth-button";
import { useLocale } from "@/lib/locale";
import { CartIcon } from "@/components/shop/cart-icon";
import { BlindCartIcon } from "@/components/blinds/blind-cart-icon";
import { siteConfig } from "@/config/site";
import type { NavLink, SiteSettings } from "@/types/cms";

interface NavbarProps {
  readonly links: NavLink[];
  readonly settings: SiteSettings;
}

// Blinds cart takes priority; fall back to shop cart; show nothing if neither.
function CartButton() {
  if (siteConfig.features.blindsImport) return <BlindCartIcon />;
  if (siteConfig.features.shop) return <CartIcon />;
  return null;
}

export function Navbar({ links, settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="" width={48} height={48} className="h-12 w-auto dark:brightness-0 dark:invert" priority />
          <Image src="/logo-name.png" alt={settings.logo_text} width={200} height={60} className="h-14 w-auto dark:brightness-0 dark:invert" priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.filter((l) => !l.hide_in_nav).map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="rounded-md px-3 py-2 text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.label)}
            </Link>
          ))}
          {settings.cta_url && settings.cta_label && (
            <Link
              href={settings.cta_url}
              className="rounded-md px-3 py-2 text-base font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {t(settings.cta_label)}
            </Link>
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1 md:flex">
          <LanguageSelector />
          <ThemeToggle />
          <CartButton />
          <div className="mx-1 h-5 w-px bg-border" />
          <NavbarAuthButton />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col px-4 py-4">
            {links.filter((l) => !l.hide_in_nav).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.label)}
              </Link>
            ))}
            {settings.cta_url && settings.cta_label && (
              <Link
                href={settings.cta_url}
                className="rounded-md px-3 py-3 text-base font-semibold text-primary transition-colors hover:text-primary/80"
                onClick={() => setMobileOpen(false)}
              >
                {t(settings.cta_label)}
              </Link>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-1">
                <LanguageSelector />
                <ThemeToggle />
                <CartButton />
              </div>
              <NavbarAuthButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
