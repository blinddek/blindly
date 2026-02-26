"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Curated subset of commonly used icons for CMS content
const iconEntries: [string, LucideIcon][] = [
  ["Home", icons.Home],
  ["Star", icons.Star],
  ["Heart", icons.Heart],
  ["Mail", icons.Mail],
  ["Phone", icons.Phone],
  ["MapPin", icons.MapPin],
  ["Clock", icons.Clock],
  ["Calendar", icons.Calendar],
  ["Users", icons.Users],
  ["Settings", icons.Settings],
  ["Shield", icons.Shield],
  ["Zap", icons.Zap],
  ["Globe", icons.Globe],
  ["Camera", icons.Camera],
  ["Image", icons.ImageIcon],
  ["FileText", icons.FileText],
  ["BarChart", icons.BarChart],
  ["TrendingUp", icons.TrendingUp],
  ["CheckCircle", icons.CheckCircle],
  ["AlertCircle", icons.AlertCircle],
  ["Info", icons.Info],
  ["Megaphone", icons.Megaphone],
  ["Sparkles", icons.Sparkles],
  ["Rocket", icons.Rocket],
  ["Target", icons.Target],
  ["Award", icons.Award],
  ["Briefcase", icons.Briefcase],
  ["ShoppingCart", icons.ShoppingCart],
  ["CreditCard", icons.CreditCard],
  ["Truck", icons.Truck],
  ["Package", icons.Package],
  ["Wrench", icons.Wrench],
  ["Code", icons.Code],
  ["Monitor", icons.Monitor],
  ["Smartphone", icons.Smartphone],
  ["Wifi", icons.Wifi],
  ["Lock", icons.Lock],
  ["Key", icons.Key],
  ["BookOpen", icons.BookOpen],
  ["GraduationCap", icons.GraduationCap],
  ["Lightbulb", icons.Lightbulb],
];

const iconMap = Object.fromEntries(iconEntries) as Record<string, LucideIcon>;
const iconNames = iconEntries.map(([name]) => name);

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an icon">
          {value && iconMap[value] ? (
            <span className="flex items-center gap-2">
              {(() => {
                const Icon = iconMap[value];
                return <Icon className="size-4" />;
              })()}
              {value}
            </span>
          ) : (
            "Select an icon"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {iconNames.map((name) => {
          const Icon = iconMap[name];
          return (
            <SelectItem key={name} value={name}>
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
