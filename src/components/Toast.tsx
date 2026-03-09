"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const colors: Record<
    ToastType,
    { bg: string; border: string; text: string }
  > = {
    success: {
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.3)",
      text: "#22c55e",
    },
    error: {
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.3)",
      text: "#ef4444",
    },
    warning: {
      bg: "rgba(234, 179, 8, 0.12)",
      border: "rgba(234, 179, 8, 0.3)",
      text: "#eab308",
    },
    info: {
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.3)",
      text: "#3b82f6",
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.875rem 1.25rem",
              borderRadius: "0.75rem",
              background: colors[toast.type].bg,
              border: `1px solid ${colors[toast.type].border}`,
              color: colors[toast.type].text,
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              minWidth: "320px",
              maxWidth: "480px",
              animation: "toast-slide-in 0.3s ease-out",
            }}
          >
            {icons[toast.type]}
            <span
              style={{
                flex: 1,
                color: "var(--color-text)",
                fontSize: "0.9375rem",
              }}
            >
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
