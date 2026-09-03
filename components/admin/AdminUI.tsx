"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};
type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void };

type AdminUIValue = {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const Ctx = createContext<AdminUIValue | null>(null);

export function useAdminUI(): AdminUIValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminUI must be used within AdminUIProvider");
  return ctx;
}

export function AdminUIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    [],
  );
  const closeConfirm = useCallback(
    (v: boolean) => {
      setConfirmState((s) => {
        s?.resolve(v);
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm(false);
      if (e.key === "Enter") closeConfirm(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmState, closeConfirm]);

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
              t.type === "success"
                ? "bg-white text-gray-800 ring-rating/20"
                : t.type === "error"
                  ? "bg-white text-gray-800 ring-red-200"
                  : "bg-white text-gray-800 ring-black/10"
            }`}
            role="status"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                t.type === "success" ? "bg-rating" : t.type === "error" ? "bg-red-500" : "bg-brand"
              }`}
            >
              {t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}
            </span>
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => closeConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg text-gray-900">
              {confirmState.title ?? "Are you sure?"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {confirmState.message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
              >
                {confirmState.cancelText ?? "Cancel"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
                  confirmState.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-brand hover:bg-brand-dark"
                }`}
              >
                {confirmState.confirmText ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
