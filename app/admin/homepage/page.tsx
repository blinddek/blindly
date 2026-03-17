"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Award,
  Wrench,
  ShoppingBag,
  Users,
  MessageSquare,
  Zap,
} from "lucide-react";

const sections = [
  {
    title: "Hero",
    description: "Main heading, subheading, video background, and CTA buttons.",
    href: "/admin/homepage/hero",
    icon: Rocket,
  },
  {
    title: "Trust Stats",
    description: "Key statistics and trust indicators below the hero.",
    href: "/admin/homepage/trust-stats",
    icon: Award,
  },
  {
    title: "How It Works",
    description: "Step-by-step process for ordering custom blinds.",
    href: "/admin/homepage/how-it-works",
    icon: Wrench,
  },
  {
    title: "Products",
    description: "Blind categories showcase with images and descriptions.",
    href: "/admin/homepage/products",
    icon: ShoppingBag,
  },
  {
    title: "About",
    description: "Company story and value proposition.",
    href: "/admin/homepage/about",
    icon: Users,
  },
  {
    title: "Testimonials",
    description: "Customer reviews and ratings.",
    href: "/admin/homepage/testimonials",
    icon: MessageSquare,
  },
  {
    title: "CTA Banner",
    description: "Final call-to-action section with heading and button.",
    href: "/admin/homepage/cta",
    icon: Zap,
  },
];

export default function HomepageOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Homepage Sections</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Manage all sections of the homepage from here.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.href}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{section.title}</CardTitle>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" size="sm">
                <Link href={section.href}>Edit</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
