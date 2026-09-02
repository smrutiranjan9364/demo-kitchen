"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rating/10 text-2xl text-rating">
          ✓
        </div>
        <h2 className="font-serif text-xl text-gray-900">Message sent!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Thanks for reaching out. We&apos;ll get back to you within 1–2 working days.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-medium text-brand hover:text-brand-light"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="font-serif text-lg text-gray-900">Send us a message</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" placeholder="Your name" required />
        <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
        <div className="sm:col-span-2">
          <Field label="Subject" name="subject" placeholder="How can we help?" required />
        </div>
        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Message <span className="text-brand">*</span>
            </span>
            <textarea
              name="message"
              rows={5}
              required
              placeholder="Write your message..."
              className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </label>
        </div>
      </div>
      <button
        type="submit"
        className="mt-5 w-full bg-brand py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light sm:w-auto sm:px-8"
      >
        SEND MESSAGE
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required ? <span className="text-brand">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}
