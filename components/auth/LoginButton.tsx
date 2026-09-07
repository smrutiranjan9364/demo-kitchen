"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";

// The form is only downloaded when a visitor opens the account dialog.
const LoginModal = dynamic(() => import("./LoginModal"));

export default function LoginButton({
  customer,
  label = "Login",
  className = "flex items-center gap-1.5 hover:opacity-80",
}: {
  customer?: { name: string } | null;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const close = useCallback(() => setOpen(false), []);

  if (customer) {
    return (
      <Link href="/account" aria-label="Your account" className={className}>
        <UserIcon className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="hidden max-w-[8rem] truncate sm:inline">{customer.name.split(" ")[0]}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Login"
        aria-haspopup="dialog"
        className={className}
      >
        <UserIcon className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>
      {open ? <LoginModal onClose={close} mode={mode} setMode={setMode} /> : null}
    </>
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
