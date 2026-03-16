"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Unlock,
  Gift,
  Clock,
  ChevronRight,
  ChevronLeft,
  Coins,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn, getUserRole } from "@/lib/auth";
import { useToast } from "@/components/Toast";
interface WalletData {
  id: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  createdAt: string;
}

// 1000 VND = 1 xu
const PACKAGES = [
  { vnd: 5000, xu: 5, label: "5.000₫" },
  { vnd: 10000, xu: 10, label: "10.000₫" },
  { vnd: 50000, xu: 50, label: "50.000₫" },
  { vnd: 100000, xu: 100, label: "100.000₫" },
];

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isWriter = getUserRole() === "WRITER";

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const { showToast } = useToast();

  const withdrawXu = parseInt(withdrawAmount, 10) || 0;
  const withdrawVndGross = withdrawXu * 1000;
  const withdrawFee = Math.floor(withdrawVndGross * 0.15);
  const withdrawVndNet = withdrawVndGross - withdrawFee;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [w, t] = await Promise.all([
        apiFetch<WalletData>("/wallet"),
        apiFetch<{ data: Transaction[]; pagination: { totalPages: number } }>(
          `/wallet/transactions?page=${page}&limit=15`,
        ),
      ]);
      setWallet(w);
      setTransactions(t.data);
      setTotalPages(t.pagination.totalPages);
    } catch {
      // handle silently
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeposit = async () => {
    if (!selectedPackage) return;
    setDepositing(true);
    try {
      const res = await apiFetch<{ checkoutUrl: string }>("/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({
          packageVnd: selectedPackage,
          returnUrl: `${window.location.origin}/wallet/success`,
          cancelUrl: `${window.location.origin}/wallet/cancel`,
        }),
      });
      // Redirect to PayOS checkout
      window.location.href = res.checkoutUrl;
    } catch (err) {
      showToast((err as Error).message || "Lỗi tạo link thanh toán", "error");
      setDepositing(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    if (withdrawXu < 200) {
      showToast("Tối thiểu 200 xu để rút", "warning");
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      showToast("Vui lòng nhập đầy đủ thông tin ngân hàng", "warning");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await apiFetch<{
        balance: number;
        message: string;
        details: { vndNet: number; fee: number };
      }>("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: withdrawXu,
          bankName,
          accountNumber,
          accountName,
        }),
      });
      setWallet((prev) => (prev ? { ...prev, balance: res.balance } : prev));
      showToast(
        `${res.message} - Thực nhận: ${res.details.vndNet.toLocaleString("vi")}₫ (phí: ${res.details.fee.toLocaleString("vi")}₫)`,
        "success",
      );
      setWithdrawAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      fetchData();
    } catch (err) {
      showToast(
        (err as Error).message ||
          "Rút tiền thất bại. Vui lòng kiểm tra lại số dư.",
        "error",
      );
    }
    setWithdrawing(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownLeft size={16} />;
      case "UNLOCK":
        return <Unlock size={16} />;
      case "DONATE":
        return <Gift size={16} />;
      case "WITHDRAWAL":
        return <ArrowUpRight size={16} />;
      default:
        return <Coins size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "Nạp xu";
      case "UNLOCK":
        return "Mua chương";
      case "DONATE":
        return "Ủng hộ";
      case "WITHDRAWAL":
        return "Rút tiền";
      case "REFUND":
        return "Hoàn xu";
      default:
        return type;
    }
  };

  if (loading && !wallet) {
    return (
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="skeleton" style={{ height: 32, width: 200 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton p-8 rounded-3xl bg-surface-brand border border-border-brand shadow-sm flex flex-col gap-2 transition-all duration-300"
              style={{ height: 100 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-medium text-sm group"
        >
          <div className="p-1.5 rounded-full bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={16} />
          </div>
          Quay lại
        </button>
        <h1 className="flex items-center gap-3 text-xl md:text-2xl font-bold text-text-primary mb-0">
          <Wallet size={24} /> Ví của tôi
        </h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-8 rounded-3xl bg-emerald-500 text-white border-none shadow-xl shadow-emerald-500/20 flex flex-col gap-2 transition-all duration-300">
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Số dư hiện tại</span>
          <span className="text-3xl font-black text-white flex items-center gap-2">
            <Coins size={20} /> {wallet?.balance?.toLocaleString("vi") || 0} xu
          </span>
        </div>
        <div className="p-8 rounded-3xl bg-surface-brand border border-border-brand shadow-sm flex flex-col gap-2 transition-all duration-300">
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Tổng đã kiếm</span>
          <span className="text-3xl font-black text-text-primary flex items-center gap-2">
            {wallet?.totalEarned?.toLocaleString("vi") || 0} xu
          </span>
        </div>
        <div className="p-8 rounded-3xl bg-surface-brand border border-border-brand shadow-sm flex flex-col gap-2 transition-all duration-300">
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Tổng đã chi</span>
          <span className="text-3xl font-black text-text-primary flex items-center gap-2">
            {wallet?.totalSpent?.toLocaleString("vi") || 0} xu
          </span>
        </div>
      </div>

      {/* Deposit via PayOS */}
      <div className="mb-8 p-8 rounded-3xl bg-surface-brand border border-border-brand shadow-sm">
        <h2 className="flex items-center gap-3 text-xl font-bold text-text-primary mb-6">
          <CreditCard size={18} /> Nạp xu qua PayOS
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Chọn gói nạp bên dưới. Bạn sẽ được chuyển đến trang thanh toán PayOS
          để hoàn tất.
        </p>
        <div className="flex gap-3 flex-wrap">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.vnd}
              type="button"
              className={`px-5 py-3 rounded-2xl border border-border-brand bg-surface-elevated text-text-secondary font-bold text-sm transition-all duration-300 hover:border-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/5 ${
                selectedPackage === pkg.vnd 
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                  : ""
              }`}
              onClick={() => setSelectedPackage(pkg.vnd)}
            >
              {pkg.label} → {pkg.xu} xu
            </button>
          ))}
        </div>
        {selectedPackage && (
          <div className="mt-4">
            <p className="text-[15px] font-semibold mb-3">
              Bạn sẽ nạp:{" "}
              <span className="text-emerald-500">
                {selectedPackage / 1000} xu
              </span>{" "}
              với giá{" "}
              <span className="text-emerald-500">
                {selectedPackage.toLocaleString("vi")}₫
              </span>
            </p>
            <button
              className="btn btn-primary"
              onClick={handleDeposit}
              disabled={depositing}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {depositing ? (
                "Đang tạo link..."
              ) : (
                <>
                  <ExternalLink size={16} /> Thanh toán qua PayOS
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Withdraw section for Writers */}
      {isWriter && (
        <div className="mb-8 p-8 rounded-3xl bg-surface-brand border border-border-brand shadow-sm">
          <h2 className="flex items-center gap-3 text-xl font-bold text-text-primary mb-6">
            <ArrowUpRight size={18} /> Rút tiền (Tác giả)
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Số dư: {wallet?.balance?.toLocaleString("vi")} xu. Tối thiểu 200 xu.
            Phí hệ thống: <strong>15%</strong>.
          </p>
          <form
            onSubmit={handleWithdraw}
            className="flex flex-col gap-6"
            style={{ gap: "1rem" }}
          >
            <div
              className="flex flex-col gap-4"
              style={{ flexDirection: "column" }}
            >
              <input
                type="number"
                min="200"
                placeholder="Nhập số xu cần rút (tối thiểu 200)..."
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1 p-4 bg-surface-elevated border border-border-brand rounded-2xl text-text-primary font-medium text-base outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:bg-surface-brand"
                required
              />
              {withdrawXu >= 200 && (
                <div className="p-3 bg-surface-elevated border border-border-brand rounded-2xl text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Tổng:</span>
                    <span>{withdrawVndGross.toLocaleString("vi")}₫</span>
                  </div>
                  <div className="flex justify-between mb-1 text-rose-500">
                    <span>Phí 15%:</span>
                    <span>-{withdrawFee.toLocaleString("vi")}₫</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-500 pt-1 border-t border-border-brand">
                    <span>Thực nhận:</span>
                    <span>{withdrawVndNet.toLocaleString("vi")}₫</span>
                  </div>
                </div>
              )}
              <input
                type="text"
                placeholder="Tên ngân hàng (VD: Vietcombank)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="flex-1 p-4 bg-surface-elevated border border-border-brand rounded-2xl text-text-primary font-medium text-base outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:bg-surface-brand"
                required
              />
              <input
                type="text"
                placeholder="Số tài khoản"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="flex-1 p-4 bg-surface-elevated border border-border-brand rounded-2xl text-text-primary font-medium text-base outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:bg-surface-brand"
                required
              />
              <input
                type="text"
                placeholder="Tên chủ tài khoản"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="flex-1 p-4 bg-surface-elevated border border-border-brand rounded-2xl text-text-primary font-medium text-base outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:bg-surface-brand"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary self-start"
              disabled={withdrawing}
            >
              {withdrawing ? "Đang xử lý..." : "Yêu cầu rút tiền"}
            </button>
          </form>
        </div>
      )}

      {/* Transaction history */}
      <div className="p-8 rounded-3xl bg-surface-brand border border-border-brand shadow-sm">
        <h2 className="flex items-center gap-3 text-xl font-bold text-text-primary mb-6">
          <Clock size={18} /> Lịch sử giao dịch
        </h2>
        {transactions.length === 0 ? (
          <p className="text-center py-16 text-text-muted italic font-medium">Chưa có giao dịch nào</p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="group flex items-center gap-6 p-4 rounded-2xl transition-all duration-300 hover:bg-surface-elevated">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      tx.amount > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                    }`}
                  >
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="font-bold text-sm text-text-primary">
                      {getTypeLabel(tx.type)}
                    </span>
                    <span className="text-xs text-text-muted truncate">{tx.description}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`font-black text-sm ${tx.amount > 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString("vi")} xu
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {new Date(tx.createdAt).toLocaleDateString("vi")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-8 text-sm font-bold text-text-secondary">
                <button
                  className="btn btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} /> Trước
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
