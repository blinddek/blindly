/* eslint-disable react-hooks/static-components -- dynamic icon from CMS data */
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const fallback: LucideIcon = icons.HelpCircle;

function resolveIcon(name: string): LucideIcon {
  const key = name as keyof typeof icons;
  const icon = icons[key];
  if (typeof icon === "function" && "displayName" in icon) {
    return icon as LucideIcon;
  }
  return fallback;
}

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = resolveIcon(name);
  return <Icon className={className} />;
}
