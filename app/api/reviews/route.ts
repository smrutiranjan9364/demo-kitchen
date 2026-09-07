import { getCustomerId } from "@/lib/auth";
import { createReview, getCustomer, getProduct, hasPurchased, hasReviewed } from "@/lib/store";

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

// Public, but gated: only a signed-in customer who has bought the product may
// review it, once. Reviews land unapproved and appear after moderation — the
// purchase check + one-per-product rule is the rate limit.
export async function POST(request: Request) {
  let body: { productId?: unknown; rating?: unknown; comment?: unknown };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request");
  }

  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
  if (!productId) return bad("Product not found.", 404);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return bad("Please choose a star rating.");
  if (comment.length < 3) return bad("Please write a short review.");

  const customerId = await getCustomerId();
  if (!customerId) return bad("Please log in to leave a review.", 401);

  const [customer, product] = await Promise.all([getCustomer(customerId), getProduct(productId)]);
  if (!customer) return bad("Please log in to leave a review.", 401);
  if (!product) return bad("Product not found.", 404);

  if (!(await hasPurchased(customerId, productId))) {
    return bad("Reviews are open to customers who have bought this item.", 403);
  }
  if (await hasReviewed(customerId, productId)) {
    return bad("You have already reviewed this item.", 409);
  }

  const review = await createReview({
    productId,
    productName: product.name,
    name: customer.name,
    rating,
    comment,
    customerId,
  });

  return Response.json({ ok: true, id: review.id }, { status: 201 });
}
