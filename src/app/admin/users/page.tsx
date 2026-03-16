"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { UserCircle, Shield, Pen, Search, Users, Ban, UserCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  isBlocked?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "ADMIN" | "WRITER" | "READER">("all");
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [blockModal, setBlockModal] = useState<{ open: boolean; id: string; name: string; isBlocked: boolean }>({ open: false, id: "", name: "", isBlocked: false });
  const [roleModal, setRoleModal] = useState<{ open: boolean; id: string; name: string; currentRole: string }>({ open: false, id: "", name: "", currentRole: "" });

  const fetchUsers = () => {
    setLoading(true);
    apiFetch<AdminUser[]>("/admin/users")
      .then((res) => setUsers(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlock = async () => {
    const { id, isBlocked } = blockModal;
    setBlockModal({ ...blockModal, open: false });
    setActionLoading(id);
    try {
      await apiFetch(`/admin/users/${id}/block`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked: !isBlocked })
      });
      showToast(`${isBlocked ? "Mở khóa" : "Khóa"} người dùng thành công`, "success");
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    const { id } = roleModal;
    setRoleModal({ ...roleModal, open: false });
    setActionLoading(id);
    try {
      await apiFetch(`/admin/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole })
      });
      showToast("Cập nhật vai trò thành công", "success");
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    all: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    WRITER: users.filter((u) => u.role === "WRITER").length,
    READER: users.filter((u) => u.role === "READER").length,
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
      ADMIN: { label: "Admin", icon: <Shield size={12} />, cls: "bg-rose-500/10 text-rose-400" },
      WRITER: { label: "Tác giả", icon: <Pen size={12} />, cls: "bg-amber-500/10 text-amber-400" },
      READER: { label: "Độc giả", icon: <UserCircle size={12} />, cls: "bg-indigo-500/10 text-indigo-400" },
    };
    const m = map[role] || map.READER;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
        {m.icon} {m.label}
      </span>
    );
  };

  const tabLabel = (r: string) => (r === "all" ? "Tất cả" : r === "ADMIN" ? "Admin" : r === "WRITER" ? "Tác giả" : "Độc giả");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users size={24} className="text-indigo-400" /> Quản lý Người dùng
      </h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-800/60 rounded-lg p-1 border border-slate-700/50">
          {(["all", "ADMIN", "WRITER", "READER"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tabLabel(r)} ({counts[r]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="h-72 animate-pulse bg-slate-800/40" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Người dùng</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Vai trò</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ngày tham gia</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-700/20 transition-colors ${user.isBlocked ? "opacity-60 bg-rose-500/[0.02]" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <UserCircle size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{user.displayName || user.username}</div>
                          <div className="text-xs text-slate-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">{user.email}</td>
                    <td className="px-5 py-3">{roleBadge(user.role)}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString("vi")}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setRoleModal({ open: true, id: user.id, name: user.displayName || user.username, currentRole: user.role })}
                          disabled={actionLoading === user.id}
                          className="p-2 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-40"
                          title="Đổi vai trò"
                        >
                          {actionLoading === user.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                        </button>
                        <button 
                          onClick={() => setBlockModal({ open: true, id: user.id, name: user.displayName || user.username, isBlocked: !!user.isBlocked })}
                          disabled={actionLoading === user.id}
                          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${user.isBlocked ? "hover:bg-emerald-500/10 text-emerald-500" : "hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"}`}
                          title={user.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                        >
                          {actionLoading === user.id ? <Loader2 size={16} className="animate-spin" /> : (user.isBlocked ? <UserCheck size={16} /> : <Ban size={16} />)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      <UserCircle size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Không tìm thấy người dùng nào.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal 
        isOpen={blockModal.open}
        title={blockModal.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        message={`Bạn có chắc muốn ${blockModal.isBlocked ? "mở khóa" : "khóa"} người dùng "${blockModal.name}"?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        variant={blockModal.isBlocked ? "primary" : "danger"}
        onConfirm={handleBlock}
        onCancel={() => setBlockModal({ ...blockModal, open: false })}
      />

      <ConfirmModal 
        isOpen={roleModal.open}
        title="Thay đổi vai trò"
        message={`Chọn vai trò mới cho người dùng "${roleModal.name}":`}
        confirmText="Lưu thay đổi"
        cancelText="Hủy"
        onConfirm={() => {}} // We'll use custom buttons inside the modal if possible, or just default to something
        onCancel={() => setRoleModal({ ...roleModal, open: false })}
      >
        <div className="grid grid-cols-3 gap-2 mt-4">
          {(["READER", "WRITER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                roleModal.currentRole === r
                  ? "bg-indigo-500 border-indigo-400 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
              }`}
            >
              {r === "ADMIN" ? "Admin" : r === "WRITER" ? "Tác giả" : "Độc giả"}
            </button>
          ))}
        </div>
      </ConfirmModal>
    </div>
  );
}
