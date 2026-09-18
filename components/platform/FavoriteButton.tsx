"use client";
import { useState } from "react";
import { requestApi } from "./UI";
export default function FavoriteButton({
  productId,
  initial = false,
}: {
  productId: string;
  initial?: boolean;
}) {
  const [saved, setSaved] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="mt-4">
      <button
        disabled={busy}
        className="text-sm font-medium text-brand disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await requestApi("/api/account/manage", {
              action: "favorite",
              productId,
              remove: saved,
            });
            setSaved(!saved);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {saved ? "♥ Saved to favorites" : "♡ Save to favorites"}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}{" "}
          <a className="underline" href="/account">
            Your account
          </a>
        </p>
      ) : null}
    </div>
  );
}
