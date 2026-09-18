"use client";
import { useState } from "react";
import { Button, Field, Notice, requestApi, formValues } from "./UI";
export default function EmailChallenge({
  purpose = "reset",
  email = "",
}: {
  purpose?: "reset" | "verify";
  email?: string;
}) {
  const [challenge, setChallenge] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = formValues(e.currentTarget);
    try {
      if (challenge) {
        await requestApi(
          "/api/account/challenge",
          { ...values, id: challenge },
          "PATCH",
        );
        setDone(true);
      } else {
        const result = await requestApi("/api/account/challenge", {
          ...values,
          purpose,
        });
        setChallenge(result.id);
        setMessage(result.message);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <p role="status" className="text-rating">
        {purpose === "reset"
          ? "Password updated. You are now signed in."
          : "Email verified. You are now signed in."}{" "}
        <a className="underline" href="/account">
          Go to your account
        </a>
      </p>
    );
  return (
    <form onSubmit={submit} className="space-y-4">
      {!challenge ? (
        <Field name="email" label="Account email" type="email" value={email} />
      ) : (
        <>
          <p className="text-sm text-gray-600">{message}</p>
          <Field name="code" label="Six-digit email code" />
          {purpose === "reset" ? (
            <Field
              name="password"
              label="New password (8–128 characters)"
              type="password"
            />
          ) : null}
        </>
      )}
      <Notice error={error} />
      <Button type="submit" disabled={busy}>
        {busy ? "Please wait…" : challenge ? "Verify code" : "Send email code"}
      </Button>
      {challenge ? (
        <button
          type="button"
          className="ml-3 text-sm text-brand underline"
          onClick={() => {
            setChallenge("");
            setError("");
          }}
        >
          Request a new code
        </button>
      ) : null}
    </form>
  );
}
