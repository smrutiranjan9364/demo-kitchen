"use client";

import { useState } from "react";
import { isServiceable, parsePincodePrefixes } from "@/lib/orders";

// "Do you deliver to me?" — answered as the shopper types, before they fill in
// a whole address. Renders nothing until the admin has set a service area.
export default function PincodeCheck({ prefixes, className = "" }: { prefixes: string; className?: string }) {
  const [code, setCode] = useState("");
  if (parsePincodePrefixes(prefixes).length === 0) return null;

  const complete = /^\d{6}$/.test(code.trim());
  const ok = complete && isServiceable(code, prefixes);

  return (
    <div className={className}>
      <label className="block">
        <span className="block text-xs font-medium text-gray-600">Check delivery to your pincode</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          placeholder="751001"
          className="mt-1 w-36 rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </label>
      {complete ? (
        <p className={`mt-1.5 text-xs font-medium ${ok ? "text-rating" : "text-red-600"}`}>
          {ok ? "✓ We deliver here." : "Sorry, we don't deliver to this pincode yet."}
        </p>
      ) : null}
    </div>
  );
}
