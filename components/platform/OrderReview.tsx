"use client";
import { useState } from "react";
import { Button, Field, Notice, formValues, requestApi } from "./UI";
export default function OrderReview({ id }: { id: string }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="mt-5 space-y-3 border-t border-black/10 pt-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await requestApi(
            `/api/orders/${id}/review`,
            formValues(e.currentTarget),
          );
          setMessage("Thank you. Your review has been saved.");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="font-serif text-lg">Rate your experience</h3>
      <Field
        name="restaurantRating"
        label="Restaurant rating (1–5)"
        type="number"
      />
      <Field
        name="deliveryRating"
        label="Delivery rating (1–5)"
        type="number"
      />
      <Field name="comment" label="Your review" />
      <Notice error={error} />
      {message ? (
        <p role="status" className="text-sm text-rating">
          {message}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          Save / update review
        </Button>
        <Button
          disabled={busy}
          onClick={async () => {
            if (!confirm("Delete your review for this order?")) return;
            setBusy(true);
            try {
              await requestApi(`/api/orders/${id}/review`, {}, "DELETE");
              setMessage("Review removed.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Delete review
        </Button>
      </div>
    </form>
  );
}
