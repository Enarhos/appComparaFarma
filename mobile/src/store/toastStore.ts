import { create } from "zustand";

export type ToastType = "alert" | "info" | "success" | "error";

export interface ToastPayload {
  id: string;
  message: string;
  subtitle?: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastPayload[];
  show: (message: string, options?: { subtitle?: string; type?: ToastType }) => void;
  dismiss: (id: string) => void;
}

let _counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, options = {}) => {
    const id = String(++_counter);
    const toast: ToastPayload = {
      id,
      message,
      subtitle: options.subtitle,
      type: options.type ?? "info",
    };
    set({ toasts: [...get().toasts, toast] });
    // Auto-dismiss después de 5 segundos
    setTimeout(() => get().dismiss(id), 5000);
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
