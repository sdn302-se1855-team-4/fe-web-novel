"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Coins, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderCode = searchParams.get("orderCode");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const verify = async () => {
      if (!orderCode) {
        setStatus("error");
        setMessage("Không tìm thấy mã đơn hàng");
        return;
      }
      try {
        const res = await apiFetch<{ status: string; message: string }>(
          `/wallet/deposit/verify?orderCode=${orderCode}`,
        );
        if (res.status === "PAID") {
          setStatus("success");
          setMessage(res.message);
        } else {
          setStatus("error");
          setMessage(res.message || "Giao dịch chưa hoàn tất");
        }
      } catch {
        setStatus("error");
        setMessage("Không thể xác minh giao dịch");
      }
    };

    verify();
  }, [orderCode, router]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => router.push("/wallet"), 4000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <>
      {status === "loading" && (
        <>
          <Loader2
            size={48}
            className="text-emerald-500 animate-spin mb-4 mx-auto"
          />
          <h2 className="text-lg font-bold">
            Đã xác minh thanh toán...
          </h2>
          <p className="text-text-muted mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle
            size={56}
            className="text-green-500 mb-4 mx-auto"
          />
          <h2 className="text-2xl font-bold">
            Nạp xu thành công! 🎉
          </h2>
          <p className="text-text-muted mt-2 flex items-center justify-center gap-2">
            <Coins size={16} /> {message}
          </p>
          <p className="text-text-muted mt-4 text-sm">
            Tự động chuyển về Ví sau 4 giây...
          </p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => router.push("/wallet")}
          >
            Về Ví ngay
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-5xl mb-4">
            ⚠️
          </div>
          <h2 className="text-lg font-bold">
            Thanh toán chưa hoàn tất
          </h2>
          <p className="text-text-muted mt-2">
            {message}
          </p>
          <button
            className="btn btn-primary mt-6"
            onClick={() => router.push("/wallet")}
          >
            Quay lại Ví
          </button>
        </>
      )}
    </>
  );
}

export default function DepositSuccessPage() {
  return (
    <div className="container py-8">
      <div className="max-w-[480px] mx-auto my-8 text-center px-8 py-12 rounded-xl bg-surface-elevated border border-border-brand shadow-lg">
        <Suspense
          fallback={
            <>
              <Loader2
                size={48}
                className="text-emerald-500 animate-spin mb-4 mx-auto"
              />
              <h2 className="text-lg font-bold">
                Đang xác minh...
              </h2>
            </>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
