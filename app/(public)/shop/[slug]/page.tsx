import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/shop/queries";
import { formatPrice } from "@/lib/shop/format";
import { productSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/config/site";
import { AddToCartButton } from "./add-to-cart-button";

interface ProductDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const url = `${process.env.NEXT_PUBLIC_APP_URL || `https://${siteConfig.domain}`}/shop/${slug}`;

  return {
    title: `${product.name.en} | ${siteConfig.name}`,
    description: product.description?.en ?? `${product.name.en} — ${formatPrice(product.price_cents)}`,
    openGraph: {
      title: product.name.en,
      description: product.description?.en ?? undefined,
      url,
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const jsonLd = productSchema({
    name: product.name.en,
    description: product.description?.en,
    price_cents: product.price_cents,
    image: product.images?.[0],
    slug: product.slug,
    stock_quantity: product.stock_quantity,
  });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 md:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col gap-4">
          {product.images?.[0] ? (
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <Image
                src={product.images[0]}
                alt={product.name.en}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground">
              No image
            </div>
          )}

          {/* Thumbnail gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={img}
                    alt={`${product.name.en} — image ${i + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-foreground">
            {product.name.en}
          </h1>

          <p className="mt-4 text-3xl font-bold text-primary">
            {formatPrice(product.price_cents)}
          </p>

          {product.stock_quantity <= 0 ? (
            <p className="mt-2 text-sm font-medium text-destructive">
              Out of stock
            </p>
          ) : product.stock_quantity <= 5 ? (
            <p className="mt-2 text-sm text-orange-600">
              Only {product.stock_quantity} left in stock
            </p>
          ) : (
            <p className="mt-2 text-sm text-green-600">In stock</p>
          )}

          {product.description?.en && (
            <div className="mt-6 text-muted-foreground">
              {product.description.en}
            </div>
          )}

          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
