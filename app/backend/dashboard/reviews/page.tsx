import { getReviews } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  await requireRight("reviews");
  const reviews = await getReviews();
  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div>
      <h1 className="font-serif text-2xl text-gray-900">Reviews</h1>
      <p className="mt-1 text-sm text-gray-500">
        {pending} awaiting approval · {reviews.length} total. Only approved reviews show on the storefront.
      </p>
      <ReviewsAdmin reviews={reviews} />
    </div>
  );
}
