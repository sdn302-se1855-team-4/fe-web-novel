"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

function CancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    if (orderCode) {
      apiFetch(`/wallet/deposit/cancel?orderCode=${orderCode}`).catch(() => {
        // Ignore error
      });
    }
  }, [orderCode]);

  return (
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
  );
}

export default function DepositCancelPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={
        <div className="max-w-[480px] mx-auto my-8 text-center px-8 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      }>
        <CancelContent />
      </Suspense>
    </div>
  );
}
