import type { Metadata } from "next";
import { BlindConfigurator } from "@/components/configurator/blind-configurator";

export const metadata: Metadata = {
  title: "Configure Your Blinds — Blindly",
  description:
    "Design your custom blinds online. Choose type, material, colour, and dimensions — get an instant price.",
};

export default function ConfigurePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Configure Your Blinds
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose your blind type, select a fabric or material, pick your colour,
          and enter your measurements to get an instant price.
        </p>
      </div>
      <BlindConfigurator />
    </section>
  );
}
