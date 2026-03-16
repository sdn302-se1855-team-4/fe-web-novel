"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function DepositCancelPage() {
  const router = useRouter();

  return (
    <div className="container py-8">
      <div className="max-w-[480px] mx-auto my-8 text-center px-8 py-12 rounded-xl bg-surface-elevated border border-border-brand shadow-lg">
        <XCircle size={56} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary">
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
