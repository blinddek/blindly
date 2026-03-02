"use client";

import Link from "next/link";
import {
  Home,
  Info,
  Wrench,
  Phone,
  HelpCircle,
  Image,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const pages = [
  {
    label: "Homepage",
    description: "Hero, services grid, about snippet, trust stats, and CTA banner.",
    icon: Home,
    href: "/admin/homepage",
  },
  {
    label: "About",
    description: "Company story, mission, process steps, and values.",
    icon: Info,
    href: "/admin/pages/about",
  },
  {
    label: "Services",
    description: "Service detail page — heading, intro, and individual service items.",
    icon: Wrench,
    href: "/admin/pages/services",
  },
  {
    label: "Contact",
    description: "Contact details, business hours, map, and WhatsApp — managed in Site Settings.",
    icon: Phone,
    href: "/admin/settings",
  },
  {
    label: "FAQ",
    description: "Frequently asked questions displayed on the /faq page.",
    icon: HelpCircle,
    href: "/admin/pages/faq",
  },
  {
    label: "Portfolio",
    description: "Gallery items — before & after photos and project case studies.",
    icon: Image,
    href: "/admin/portfolio",
  },
];

export default function PagesHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the content of each page on the site.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Link key={page.label} href={page.href} className="h-full">
              <Card className="group h-full cursor-pointer transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{page.label}</CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                          {page.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
