"use client";

import React, { createContext, useContext, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const iconClasses = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  };

  const bgClasses = {
    success: "bg-white dark:bg-zinc-900 border-emerald-500/30",
    error: "bg-white dark:bg-zinc-900 border-red-500/30",
    info: "bg-white dark:bg-zinc-900 border-blue-500/30",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container floating at top right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-xs w-full pointer-events-none select-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3.5 p-4 rounded-xl border shadow-xl animate-bounce-in transition-all ${bgClasses[t.type]}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">{iconClasses[t.type]}</span>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 cursor-pointer"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
