export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto max-w-7xl animate-pulse px-4 py-12"
    >
      <div className="mb-8 h-10 w-64 rounded bg-brand/10" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-brand/5" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
