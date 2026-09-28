"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";
interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (variant: ToastVariant, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Keyed by "variant:message" so a repeated identical toast (e.g. clicking
  // a blocked submit button several times) refreshes its own timer instead
  // of piling up duplicate, overlapping toasts.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const key = `${variant}:${message}`;
    const existingTimer = timers.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    setToasts((prev) => {
      const withoutDuplicate = prev.filter((t) => `${t.variant}:${t.message}` !== key);
      return [...withoutDuplicate, { id: nextId++, variant, message }];
    });

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => `${t.variant}:${t.message}` !== key));
      timers.current.delete(key);
    }, 3500);
    timers.current.set(key, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>{children}</ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
