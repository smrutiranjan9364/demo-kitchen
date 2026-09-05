"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

// The form is only downloaded when a visitor opens the account dialog.
const LoginModal = dynamic(() => import("./LoginModal"));

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [notice, setNotice] = useState("");
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Login"
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 hover:opacity-80"
      >
        <UserIcon className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Login</span>
      </button>
      {open ? (
        <LoginModal
          onClose={close}
          mode={mode}
          setMode={setMode}
          notice={notice}
          setNotice={setNotice}
        />
      ) : null}
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
