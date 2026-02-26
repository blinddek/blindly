"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Columns3, Settings } from "lucide-react";

const cards = [
  {
    title: "Nav Links",
    description: "Manage main navigation links",
    href: "/admin/navigation/nav-links",
    icon: Navigation,
  },
  {
    title: "Footer",
    description: "Manage footer sections and links",
    href: "/admin/navigation/footer",
    icon: Columns3,
  },
  {
    title: "Site Settings",
    description: "Logo, company name, CTA buttons",
    href: "/admin/navigation/settings",
    icon: Settings,
  },
];

export default function NavigationOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Navigation &amp; Layout
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your site&apos;s navigation, footer, and global settings.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.href}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <card.icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{card.title}</CardTitle>
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={card.href}>Manage</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
