"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ConfirmModal, { InputModal } from "@/components/ConfirmModal";
import { Wallet, Search } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  description: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  wallet: { user: { id: string; displayName: string; email: string; username: string } };
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "PENDING" | "COMPLETED" | "FAILED">("all");
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const { showToast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Withdrawal[]>("/admin/withdrawals");
      setWithdrawals(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải danh sách rút tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, []);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      setConfirmModal({ open: false, id: "", name: "" });
      await apiFetch(`/admin/withdrawals/${id}/approve`, { method: "PUT" });
      showToast("Đã duyệt yêu cầu rút tiền!", "success");
      fetchWithdrawals();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi duyệt", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      setProcessingId(id);
      setRejectModal({ open: false, id: "", name: "" });
      await apiFetch(`/admin/withdrawals/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) });
      showToast("Đã từ chối và hoàn tiền xu!", "warning");
      fetchWithdrawals();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi từ chối", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = withdrawals.filter((w) => {
    const matchFilter = filter === "all" || w.status === filter;
    const matchSearch = !search || w.wallet.user.displayName?.toLowerCase().includes(search.toLowerCase()) || w.wallet.user.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = { all: withdrawals.length, PENDING: withdrawals.filter((w) => w.status === "PENDING").length, COMPLETED: withdrawals.filter((w) => w.status === "COMPLETED").length, FAILED: withdrawals.filter((w) => w.status === "FAILED").length };

  if (error) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Wallet size={24} className="text-indigo-400" /> Quản lý Rút tiền</h1>
      <div className="rounded-xl bg-slate-800/50 border border-rose-500/30 p-8 text-center text-rose-400 text-sm">{error}</div>
    </div>
  );

  const statusBadge = (status: string) => {
    const m: Record<string, { label: string; cls: string }> = { PENDING: { label: "Đang chờ", cls: "bg-amber-500/10 text-amber-400" }, COMPLETED: { label: "Hoàn thành", cls: "bg-emerald-500/10 text-emerald-400" }, FAILED: { label: "Từ chối", cls: "bg-rose-500/10 text-rose-400" } };
    const d = m[status] || m.PENDING;
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${d.cls}`}>{d.label}</span>;
  };

  const tabLabel = (s: string) => s === "all" ? "Tất cả" : s === "PENDING" ? "Đang chờ" : s === "COMPLETED" ? "Hoàn thành" : "Từ chối";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Wallet size={24} className="text-indigo-400" /> Quản lý Rút tiền</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Tìm kiếm tác giả..." className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-slate-800/60 rounded-lg p-1 border border-slate-700/50">
          {(["all", "PENDING", "COMPLETED", "FAILED"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filter === s ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
              {tabLabel(s)} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
        {loading ? <div className="h-72 animate-pulse bg-slate-800/40" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["Tác giả", "Chi tiết", "Số xu", "Trạng thái", "Thời gian", "Thao tác"].map((h) => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${h === "Thao tác" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold text-white">{w.wallet.user.displayName}</div>
                      <div className="text-xs text-slate-500">{w.wallet.user.email}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 max-w-[240px] truncate">{w.description}</td>
                    <td className="px-5 py-3 text-sm font-bold text-rose-400">{Math.abs(w.amount).toLocaleString("vi")} xu</td>
                    <td className="px-5 py-3">{statusBadge(w.status)}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{new Date(w.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="px-5 py-3 text-right">
                      {w.status === "PENDING" && (
                        <div className="flex gap-2 justify-end">
                          <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-40 cursor-pointer" onClick={() => setConfirmModal({ open: true, id: w.id, name: w.wallet.user.displayName })} disabled={processingId === w.id}>Duyệt</button>
                          <button className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors disabled:opacity-40 cursor-pointer" onClick={() => setRejectModal({ open: true, id: w.id, name: w.wallet.user.displayName })} disabled={processingId === w.id}>Từ chối</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500"><Wallet size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Không có yêu cầu rút tiền nào.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={confirmModal.open} title="Xác nhận duyệt rút tiền" message={`Bạn xác nhận đã CHUYỂN KHOẢN thành công cho tác giả "${confirmModal.name}"?`} confirmText="Đã chuyển khoản" cancelText="Hủy" variant="primary" onConfirm={() => handleApprove(confirmModal.id)} onCancel={() => setConfirmModal({ open: false, id: "", name: "" })} />
      <InputModal isOpen={rejectModal.open} title="Từ chối yêu cầu rút tiền" message={`Nhập lý do từ chối cho tác giả "${rejectModal.name}". Xu sẽ được hoàn lại vào ví.`} placeholder="Lý do từ chối..." confirmText="Xác nhận từ chối" cancelText="Hủy" onConfirm={(reason) => handleReject(rejectModal.id, reason)} onCancel={() => setRejectModal({ open: false, id: "", name: "" })} />
    </div>
  );
}
