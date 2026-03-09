import type { Metadata } from "next";
import { BlindConfigurator } from "@/components/configurator/blind-configurator";
import type { BlindState } from "@/components/configurator/blind-configurator";

export const metadata: Metadata = {
  title: "Configure Your Blinds — Blindly",
  description:
    "Design your custom blinds online. Choose type, material, colour, and dimensions — get an instant price.",
};

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function ConfigurePage({ searchParams }: Props) {
  const params = await searchParams;

  let prefill: Partial<BlindState> | undefined;
  let startStep = 0;

  if (params.range_id) {
    prefill = {
      category_id: params.category_id ?? "",
      category_slug: params.category_slug ?? "",
      type_id: params.type_id ?? "",
      range_id: params.range_id,
      colour: params.colour ?? "",
    };
    startStep = params.colour ? 3 : 2;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {prefill ? "Almost there — enter your measurements" : "Configure Your Blinds"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {prefill
            ? "We've pre-selected your style and colour. Just add your window measurements to get an instant price."
            : "Choose your blind type, select a fabric or material, pick your colour, and enter your measurements to get an instant price."}
        </p>
      </div>
      <BlindConfigurator prefill={prefill} startStep={startStep} />
    </section>
  );
}
