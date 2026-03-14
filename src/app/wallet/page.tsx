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
import styles from "./wallet.module.css";

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
      <div className={`container ${styles.page}`}>
        <div className={styles.header}>
          <div className="skeleton" style={{ height: 32, width: 200 }} />
        </div>
        <div className={styles.statsRow}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`skeleton ${styles.statCard}`}
              style={{ height: 100 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
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
        <h1 className={`${styles.title} !mb-0`}>
          <Wallet size={24} /> Ví của tôi
        </h1>
      </div>

      {/* Stats cards */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.balanceCard}`}>
          <span className={styles.statLabel}>Số dư hiện tại</span>
          <span className={styles.statValue}>
            <Coins size={20} /> {wallet?.balance?.toLocaleString("vi") || 0} xu
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tổng đã kiếm</span>
          <span className={styles.statValue}>
            {wallet?.totalEarned?.toLocaleString("vi") || 0} xu
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tổng đã chi</span>
          <span className={styles.statValue}>
            {wallet?.totalSpent?.toLocaleString("vi") || 0} xu
          </span>
        </div>
      </div>

      {/* Deposit via PayOS */}
      <div className={styles.depositSection}>
        <h2 className={styles.sectionTitle}>
          <CreditCard size={18} /> Nạp xu qua PayOS
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginBottom: "1rem",
          }}
        >
          Chọn gói nạp bên dưới. Bạn sẽ được chuyển đến trang thanh toán PayOS
          để hoàn tất.
        </p>
        <div className={styles.quickAmounts}>
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.vnd}
              type="button"
              className={`${styles.quickBtn} ${selectedPackage === pkg.vnd ? styles.quickBtnActive : ""}`}
              onClick={() => setSelectedPackage(pkg.vnd)}
            >
              {pkg.label} → {pkg.xu} xu
            </button>
          ))}
        </div>
        {selectedPackage && (
          <div style={{ marginTop: "1rem" }}>
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Bạn sẽ nạp:{" "}
              <span style={{ color: "var(--color-primary)" }}>
                {selectedPackage / 1000} xu
              </span>{" "}
              với giá{" "}
              <span style={{ color: "var(--color-primary)" }}>
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
        <div className={styles.depositSection}>
          <h2 className={styles.sectionTitle}>
            <ArrowUpRight size={18} /> Rút tiền (Tác giả)
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: "1rem",
            }}
          >
            Số dư: {wallet?.balance?.toLocaleString("vi")} xu. Tối thiểu 200 xu.
            Phí hệ thống: <strong>15%</strong>.
          </p>
          <form
            onSubmit={handleWithdraw}
            className={styles.depositForm}
            style={{ gap: "1rem" }}
          >
            <div
              className={styles.depositRow}
              style={{ flexDirection: "column" }}
            >
              <input
                type="number"
                min="200"
                placeholder="Nhập số xu cần rút (tối thiểu 200)..."
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className={styles.depositInput}
                required
              />
              {withdrawXu >= 200 && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span>Tổng:</span>
                    <span>{withdrawVndGross.toLocaleString("vi")}₫</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                      color: "var(--color-error)",
                    }}
                  >
                    <span>Phí 15%:</span>
                    <span>-{withdrawFee.toLocaleString("vi")}₫</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      paddingTop: "0.25rem",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
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
                className={styles.depositInput}
                required
              />
              <input
                type="text"
                placeholder="Số tài khoản"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={styles.depositInput}
                required
              />
              <input
                type="text"
                placeholder="Tên chủ tài khoản"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className={styles.depositInput}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={withdrawing}
              style={{ alignSelf: "flex-start" }}
            >
              {withdrawing ? "Đang xử lý..." : "Yêu cầu rút tiền"}
            </button>
          </form>
        </div>
      )}

      {/* Transaction history */}
      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>
          <Clock size={18} /> Lịch sử giao dịch
        </h2>
        {transactions.length === 0 ? (
          <p className={styles.empty}>Chưa có giao dịch nào</p>
        ) : (
          <>
            <div className={styles.transactionList}>
              {transactions.map((tx) => (
                <div key={tx.id} className={styles.txItem}>
                  <div
                    className={`${styles.txIcon} ${tx.amount > 0 ? styles.txPositive : styles.txNegative}`}
                  >
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className={styles.txInfo}>
                    <span className={styles.txType}>
                      {getTypeLabel(tx.type)}
                    </span>
                    <span className={styles.txDesc}>{tx.description}</span>
                  </div>
                  <div className={styles.txRight}>
                    <span
                      className={`${styles.txAmount} ${tx.amount > 0 ? styles.txPositive : styles.txNegative}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString("vi")} xu
                    </span>
                    <span className={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("vi")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className={styles.pagination}>
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
