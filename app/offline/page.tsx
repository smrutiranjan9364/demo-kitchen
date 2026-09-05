import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("/offline");

export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon-192.png"
        alt="Rosy's Kitchen"
        width={72}
        height={72}
        className="mb-6 h-18 w-18 rounded-2xl"
      />
      <h1 className="text-2xl font-semibold text-[#4f1a2e]">
        You&apos;re offline
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-600">
        We can&apos;t reach the kitchen right now. Check your internet
        connection and try again — recently viewed pages may still work.
      </p>
      {/* A full navigation retries the network after an offline response. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="mt-6 rounded-lg bg-[#6d2440] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4f1a2e]"
      >
        Try again
      </a>
    </div>
  );
}
