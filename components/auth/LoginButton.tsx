"use client";

import { useState, useEffect } from "react";

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [notice, setNotice] = useState("");

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setNotice("");
  };

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 hover:opacity-80"
      >
        <UserIcon className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Login</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "login" ? "Login" : "Create account"}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 text-gray-800 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-gray-400 hover:text-brand"
            >
              ✕
            </button>

            <h2 className="font-serif text-2xl text-brand">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "login"
                ? "Log in to your Rosy's Kitchen account."
                : "Join Rosy's Kitchen to start ordering."}
            </p>

            {notice ? (
              <p className="mt-4 rounded-md bg-rating/10 px-3 py-2 text-sm font-medium text-rating">
                {notice}
              </p>
            ) : null}

            {/* Google login */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-md border border-black/15 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-black/10" />
              <span className="text-xs text-gray-400">or</span>
              <span className="h-px flex-1 bg-black/10" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "register") {
                  // Account creation is its own step — confirm, then send to login.
                  setMode("login");
                  setNotice("Account created! Please log in to continue.");
                } else {
                  setOpen(false);
                }
              }}
              className="space-y-4"
            >
              {mode === "register" ? (
                <>
                  <Field label="Full name" name="name" type="text" placeholder="Rosy Sahoo" />
                  <Field label="Phone" name="phone" type="tel" placeholder="9437141055" />
                </>
              ) : null}
              <Field label="Email" name="email" type="email" placeholder="you@example.com" />
              <Field
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
              />
              {mode === "register" ? (
                <Field
                  label="Confirm password"
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                />
              ) : null}

              {mode === "login" ? (
                <div className="text-right">
                  <a href="#" className="text-xs font-medium text-brand hover:text-brand-light">
                    Forgot password?
                  </a>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full bg-brand py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
              >
                {mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-semibold text-brand hover:text-brand-light"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-brand hover:text-brand-light"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.2v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8L20 3.2A12 12 0 0 0 1.2 6.6l4 3.1c1-2.9 3.7-4.9 6.8-4.9Z"
      />
    </svg>
  );
}
