"use client";

import { useToast } from "@/lib/toast-context";

// Muted tint per Brand Bible §6, radius-md, no drop shadow — a quiet confirmation,
// not a generic shadow-heavy toast-library default.
export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            toast.variant === "success"
              ? "bg-sage/15 text-sage"
              : "bg-error/10 text-error"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              toast.variant === "success" ? "bg-sage" : "bg-error"
            }`}
          />
          {toast.message}
        </div>
      ))}
    </div>
  );
}
