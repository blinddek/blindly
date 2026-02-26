export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 animate-pulse">
      <div className="h-9 w-24 rounded bg-muted" />
      <div className="mt-2 h-5 w-40 rounded bg-muted" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-square bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
