"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Toast = { id: string; message: string; tone: "success" | "error" };
type Ctx = {
  push: (message: string, tone?: "success" | "error") => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, tone }]);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const id = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 2800);
    return () => clearTimeout(id);
  }, [toasts]);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-2.5 text-[12.5px] font-semibold shadow-[0_8px_24px_-12px_rgba(10,10,18,0.25)] ${
              t.tone === "success"
                ? "border-success/30 bg-white text-success"
                : "border-error/30 bg-white text-error"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
