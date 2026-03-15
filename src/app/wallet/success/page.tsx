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
      router.push("/login");
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
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            Đang xác minh thanh toán...
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "0.5rem",
            }}
          >
            Vui lòng chờ trong giây lát
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle
            size={56}
            style={{ color: "#22c55e", marginBottom: "1rem" }}
            className="mx-auto"
          />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Nạp xu thành công! 🎉
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Coins size={16} /> {message}
          </p>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "1rem",
              fontSize: "0.875rem",
            }}
          >
            Tự động chuyển về Ví sau 4 giây...
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/wallet")}
            style={{ marginTop: "1rem" }}
          >
            Về Ví ngay
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
            }}
          >
            ⚠️
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            Thanh toán chưa hoàn tất
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginTop: "0.5rem",
            }}
          >
            {message}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/wallet")}
            style={{ marginTop: "1.5rem" }}
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
        <Suspense
          fallback={
            <>
              <Loader2
                size={48}
                className="text-emerald-500 animate-spin mb-4 mx-auto"
              />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
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
