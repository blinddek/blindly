"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSelector } from "@/components/shared/language-selector";
import { NavbarAuthButton } from "@/components/shared/navbar-auth-button";
import { useLocale } from "@/lib/locale";
import { CartIcon } from "@/components/shop/cart-icon";
import { siteConfig } from "@/config/site";
import type { NavLink, SiteSettings } from "@/types/cms";

interface NavbarProps {
  links: NavLink[];
  settings: SiteSettings;
}

export function Navbar({ links, settings }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt={settings.logo_text} width={140} height={36} className="h-9 w-auto dark:invert" priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1 md:flex">
          <LanguageSelector />
          <ThemeToggle />
          {siteConfig.features.shop && <CartIcon />}
          <div className="mx-1 h-5 w-px bg-border" />
          <NavbarAuthButton />
          <Link href={settings.cta_url}>
            <Button size="sm">{t(settings.cta_label)}</Button>
          </Link>
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
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.label)}
              </Link>
            ))}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-1">
                <LanguageSelector />
                <ThemeToggle />
                {siteConfig.features.shop && <CartIcon />}
              </div>
              <div className="flex items-center gap-2">
                <NavbarAuthButton />
                <Link href={settings.cta_url} onClick={() => setMobileOpen(false)}>
                  <Button size="sm">{t(settings.cta_label)}</Button>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
