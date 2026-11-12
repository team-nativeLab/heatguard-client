import { useCallback, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastItem } from "./toastContext";

const VARIANT_STYLES: Record<ToastItem["variant"], string> = {
  default: "border-[var(--color-border)]",
  success: "border-[#16a34a]",
  error: "border-[#dc2626]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, variant: ToastItem["variant"] = "default") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-[var(--color-bg-card)] border ${VARIANT_STYLES[toast.variant]} text-[var(--color-text-heading)] text-sm rounded-lg px-4 py-3 shadow-2xl animate-[fadeIn_0.15s_ease-out]`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
