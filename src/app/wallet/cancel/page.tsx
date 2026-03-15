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
        <p
          style={{
            color: "var(--color-text-muted)",
            marginTop: "0.5rem",
          }}
        >
          Bạn đã huỷ giao dịch nạp xu. Không có khoản nào bị trừ.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/wallet")}
          style={{ marginTop: "1.5rem" }}
        >
          Quay lại Ví
        </button>
      </div>
    </div>
  );
}
