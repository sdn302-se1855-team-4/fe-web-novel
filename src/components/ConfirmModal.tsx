"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        animation: "modal-fade-in 0.2s ease-out",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
          animation: "modal-scale-in 0.25s ease-out",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                variant === "danger"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(59, 130, 246, 0.1)",
              color: variant === "danger" ? "#ef4444" : "#3b82f6",
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
            {title}
          </h3>
        </div>

        <p
          style={{
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
            margin: "0 0 1.5rem",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              background:
                variant === "danger" ? "#ef4444" : "var(--color-primary)",
              color: "#fff",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ----- Input Modal (replaces prompt()) ----- */
interface InputModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({
  isOpen,
  title,
  message,
  placeholder = "",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
}: InputModalProps) {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        animation: "modal-fade-in 0.2s ease-out",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
          animation: "modal-scale-in 0.25s ease-out",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.125rem",
            fontWeight: 600,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
            margin: "0 0 1rem",
          }}
        >
          {message}
        </p>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "0.9375rem",
            marginBottom: "1.5rem",
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onConfirm(value);
              setValue("");
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
