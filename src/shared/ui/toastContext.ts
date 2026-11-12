import { createContext, useContext } from "react";

export interface ToastItem {
  id: number;
  message: string;
  variant: "default" | "success" | "error";
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastItem["variant"]) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
