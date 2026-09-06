"use client";

import { useRef, useState } from "react";

// An image field that uploads a file to /api/admin/upload and stores the
// returned URL. A pasted URL is still accepted as a fallback.
export default function ImageUpload({
  label = "Image",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>

      <div className="flex items-start gap-3">
        {/* Preview / drop target */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-black/15 bg-cream-soft text-gray-400 transition hover:border-brand hover:text-brand"
          aria-label="Upload image"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <UploadIcon className="h-6 w-6" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={busy}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 disabled:opacity-60"
              >
                Remove
              </button>
            ) : null}
          </div>

          {/* Fallback: paste a URL directly. */}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="or paste an image URL"
            className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
