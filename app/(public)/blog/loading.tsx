export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 animate-pulse">
      <div className="h-9 w-32 rounded bg-muted" />
      <div className="mt-2 h-5 w-48 rounded bg-muted" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-video bg-muted" />
            <div className="space-y-2 p-5">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-5 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
