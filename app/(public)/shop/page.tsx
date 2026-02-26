import Link from "next/link";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { getActiveProducts, getProductCategories } from "@/lib/shop/queries";
import { ProductCard } from "@/components/shop/product-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export async function generateMetadata() {
  return generatePageMetadata("shop");
}

interface ShopPageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const search = params.search;
  const sort = (params.sort as "newest" | "price_asc" | "price_desc") || "newest";

  const [products, categories] = await Promise.all([
    getActiveProducts({ categorySlug, search, sort }),
    getProductCategories(),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">Shop</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Browse our products
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <Link href="/shop">
            <Badge
              variant={categorySlug ? "outline" : "default"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
              <Badge
                variant={categorySlug === cat.slug ? "default" : "outline"}
                className="cursor-pointer"
              >
                {cat.name.en}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <form action="/shop" method="get" className="flex gap-2">
            {categorySlug && (
              <input type="hidden" name="category" value={categorySlug} />
            )}
            <Input
              name="search"
              placeholder="Search products..."
              defaultValue={search ?? ""}
              className="w-48"
            />
          </form>
          <div className="flex gap-1">
            {(
              [
                ["newest", "Newest"],
                ["price_asc", "Price ↑"],
                ["price_desc", "Price ↓"],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value}
                href={`/shop?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  ...(search ? { search } : {}),
                  sort: value,
                })}`}
              >
                <Badge
                  variant={sort === value ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          No products found. Check back soon!
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
