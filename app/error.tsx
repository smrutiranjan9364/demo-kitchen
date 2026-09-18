"use client";
import Link from "next/link";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-3xl">We couldn’t load this page</h1>
      <p className="mt-3 text-gray-500">
        Please try again. If the problem continues, contact the kitchen.
      </p>
      <button
        onClick={retry}
        className="mt-6 rounded-lg bg-brand px-6 py-3 text-cream"
      >
        Try again
      </button>
      <Link href="/" className="ml-4 text-brand underline">
        Home
      </Link>
    </main>
  );
}
