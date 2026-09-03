import { createReview } from "@/lib/store";

// Public: called by the product page when a customer submits a review, so the
// admin panel can see reviews left across the site.
export async function POST(request: Request) {
  let body: {
    productId?: string;
    productName?: string;
    name?: string;
    rating?: number;
    comment?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.productId || !body.rating || !body.comment) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const review = await createReview({
    productId: body.productId,
    productName: body.productName,
    name: (body.name || "Anonymous").slice(0, 60),
    rating: Math.max(1, Math.min(5, Math.round(body.rating))),
    comment: body.comment.slice(0, 1000),
  });

  return Response.json({ ok: true, id: review.id }, { status: 201 });
}
