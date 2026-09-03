import { getReviews } from "@/lib/store";
import { requireRight } from "@/lib/guard";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function ReviewsPage() {
  await requireRight("reviews");
  const reviews = await getReviews();

  return (
    <div>
      <h1 className="font-serif text-2xl text-gray-900">Reviews</h1>
      <p className="mt-1 text-sm text-gray-500">{reviews.length} reviews</p>

      {reviews.length === 0 ? (
        <p className="mt-10 rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          No reviews yet. Reviews submitted on product pages will appear here.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-brand">
                    {r.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <span className="text-amber-400 text-xs">{"★".repeat(r.rating)}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>{fmtDate(r.createdAt)}</p>
                  {r.productName ? (
                    <p className="mt-0.5 font-medium text-gray-500">{r.productName}</p>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
