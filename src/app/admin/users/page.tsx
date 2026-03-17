"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { UserCircle, Search, Users, Ban, UserCheck, Loader2 } from "lucide-react";
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
    const map: Record<string, { label: string; cls: string }> = {
      ADMIN: { label: "Admin", cls: "bg-rose-500/10 text-rose-400" },
      WRITER: { label: "Tác giả", cls: "bg-amber-500/10 text-amber-400" },
      READER: { label: "Độc giả", cls: "bg-indigo-500/10 text-indigo-400" },
    };
    const m = map[role] || map.READER;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
        {m.label}
      </span>
    );
  };

  const tabLabel = (r: string) => (r === "all" ? "Tất cả" : r === "ADMIN" ? "Admin" : r === "WRITER" ? "Tác giả" : "Độc giả");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <Users size={24} className="text-indigo-500" /> Quản lý Người dùng
      </h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-surface-elevated rounded-lg p-1 border border-border-brand">
          {(["all", "ADMIN", "WRITER", "READER"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? "bg-surface-brand text-text-primary shadow-sm border border-border-brand"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tabLabel(r)} ({counts[r]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-surface-brand border border-border-brand overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-72 animate-pulse bg-surface-brand" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-brand bg-surface-elevated/50">
                  <th className="w-[30%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Người dùng</th>
                  <th className="w-[30%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Email</th>
                  <th className="w-[15%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Vai trò</th>
                  <th className="w-[15%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Ngày tham gia</th>
                  <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand">
                {filtered.map((user) => (
                  <tr key={user.id} className={`hover:bg-surface-elevated transition-colors ${user.isBlocked ? "opacity-60 bg-rose-500/5" : ""}`}>
                    <td className="px-5 py-4 align-middle text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted shrink-0 border border-border-brand">
                          <UserCircle size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary leading-tight">{user.displayName || user.username}</div>
                          <div className="text-xs text-text-muted mt-0.5">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle text-sm text-text-secondary text-left">{user.email}</td>
                    <td className="px-5 py-4 align-middle text-left">{roleBadge(user.role)}</td>
                    <td className="px-5 py-4 align-middle text-left text-sm text-text-muted">{new Date(user.createdAt).toLocaleDateString("vi")}</td>
                    <td className="px-5 py-4 align-middle text-left">
                      {user.role !== "ADMIN" && (
                        <button
                          onClick={() => setBlockModal({ open: true, id: user.id, name: user.displayName || user.username, isBlocked: !!user.isBlocked })}
                          disabled={actionLoading === user.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 border ${
                            user.isBlocked
                              ? "text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                              : "text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50"
                          }`}
                          title={user.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : user.isBlocked ? (
                            <><UserCheck size={13} /> Mở khóa</>
                          ) : (
                            <><Ban size={13} /> Khóa</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-text-muted">
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

      {/* Block/Unblock Modal */}
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
    </div>
  );
}
