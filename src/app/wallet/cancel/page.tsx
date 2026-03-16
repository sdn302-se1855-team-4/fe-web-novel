"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function DepositCancelPage() {
  const router = useRouter();

  return (
    <div className="container py-8">
      <div
        style={{
          maxWidth: 480,
          margin: "2rem auto",
          textAlign: "center",
          padding: "3rem 2rem",
          borderRadius: "var(--radius-xl)",
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <XCircle size={56} style={{ color: "#ef4444", marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Đã huỷ thanh toán
        </h2>
        <p className="text-text-muted mt-2 text-sm">
          Bạn đã huỷ giao dịch nạp xu. Không có khoản nào bị trừ.
        </p>
        <button
          className="btn btn-primary mt-6"
          onClick={() => router.push("/wallet")}
        >
          Quay lại Ví
        </button>
      </div>
    </div>
  );
}
