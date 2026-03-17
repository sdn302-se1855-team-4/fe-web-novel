"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Layers, Plus, Edit2, Trash2, HelpCircle } from "lucide-react";

interface Genre {
  id: string;
  name: string;
  slug: string;
  _count: { stories: number };
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const { showToast } = useToast();

  const fetchGenres = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Genre[]>("/admin/genres");
      setGenres(res);
    } catch {
      showToast("Lỗi khi tải danh sách thể loại", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchGenres(); }, [fetchGenres]);

  const genSlug = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const onNameChange = (v: string) => { setName(v); if (!formModal.editId) setSlug(genSlug(v)); };

  const openCreateModal = () => {
    setName("");
    setSlug("");
    setFormModal({ open: true, editId: null });
  };

  const openEditModal = (g: Genre) => {
    setName(g.name);
    setSlug(g.slug);
    setFormModal({ open: true, editId: g.id });
  };

  const closeFormModal = () => {
    setFormModal({ open: false, editId: null });
    setName("");
    setSlug("");
  };

  const submit = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      if (formModal.editId) {
        await apiFetch(`/admin/genres/${formModal.editId}`, { method: "PUT", body: JSON.stringify({ name: name.trim(), slug: slug.trim() }) });
        showToast("Đã cập nhật thể loại", "success");
      } else {
        await apiFetch("/admin/genres", { method: "POST", body: JSON.stringify({ name: name.trim(), slug: slug.trim() }) });
        showToast("Đã tạo thể loại mới", "success");
      }
      closeFormModal();
      fetchGenres();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    const { id } = deleteModal;
    setDeleteModal({ open: false, id: "", name: "" });
    try {
      await apiFetch(`/admin/genres/${id}`, { method: "DELETE" });
      showToast("Đã xóa thể loại", "success");
      fetchGenres();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Xóa thất bại", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Layers size={24} className="text-amber-500" /> Quản lý Thể loại
        </h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
        >
          <Plus size={16} /> Thêm thể loại
        </button>
      </div>

      <div className="rounded-xl bg-surface-brand border border-border-brand overflow-hidden shadow-sm">
        {loading ? <div className="h-48 animate-pulse bg-surface-brand" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-brand bg-surface-elevated/50">
                  <th className="w-[35%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Tên thể loại</th>
                  <th className="w-[30%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Slug</th>
                  <th className="w-[15%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Số truyện</th>
                  <th className="w-[20%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand">
                {genres.map((g) => (
                  <tr key={g.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="px-5 py-4 align-middle text-sm font-semibold text-text-primary text-left">{g.name}</td>
                    <td className="px-5 py-4 align-middle text-left text-sm text-text-secondary font-mono">{g.slug}</td>
                    <td className="px-5 py-4 align-middle text-left">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                        {g._count.stories} truyện
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle text-left">
                      <div className="flex items-center gap-2 group">
                        <button onClick={() => openEditModal(g)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-500/30">
                          <Edit2 size={13} /> Sửa
                        </button>
                        <button 
                          onClick={() => {
                            if (g._count.stories > 0) {
                              showToast("Phải xóa hết truyện thuộc thể loại này trước", "error");
                              return;
                            }
                            setDeleteModal({ open: true, id: g.id, name: g.name })
                          }} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                            g._count.stories > 0 
                              ? "text-slate-400 bg-slate-500/5 cursor-not-allowed border-slate-500/20" 
                              : "text-rose-500 hover:bg-rose-500/10 cursor-pointer border-rose-500/30"
                          }`}
                          title={g._count.stories > 0 ? "Phải xóa hết truyện thuộc thể loại này trước" : ""}
                        >
                          <Trash2 size={13} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {genres.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-text-muted"><Layers size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Chưa có thể loại nào. Thêm thể loại đầu tiên!</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {formModal.open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)",
            animation: "modal-fade-in 0.2s ease-out",
          }}
          onClick={closeFormModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "1rem", padding: "2rem",
              maxWidth: "460px", width: "90%",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
              animation: "modal-scale-in 0.25s ease-out",
            }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-text-primary">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Layers size={18} className="text-amber-500" />
              </div>
              {formModal.editId ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Tên thể loại</label>
                <input
                  type="text"
                  placeholder="Nhập tên thể loại..."
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-elevated border border-border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
                  Slug
                  <span className="relative group">
                    <HelpCircle size={13} className="text-text-muted cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 rounded-lg bg-surface-brand border border-border-brand text-[11px] text-text-secondary shadow-2xl opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 leading-relaxed pointer-events-auto">
                      Dùng để tạo đường dẫn URL đẹp. Hệ thống sẽ tự động tạo khi bạn nhập tên.
                    </span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="thu-gian"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-elevated/50 border border-border-brand text-sm text-text-muted cursor-not-allowed font-mono shadow-inner"
                  value={slug}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-700/30">
              <button onClick={closeFormModal} className="btn btn-ghost transition-all cursor-pointer">Hủy</button>
              <button
                onClick={submit}
                disabled={saving || !name.trim()}
                className="btn btn-primary transition-all cursor-pointer disabled:opacity-40"
              >
                {saving ? "Đang lưu..." : formModal.editId ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modal-scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          `}</style>
        </div>
      )}

      <ConfirmModal isOpen={deleteModal.open} title="Xóa thể loại" message={`Bạn có chắc muốn xóa thể loại "${deleteModal.name}"?`} confirmText="Xóa" cancelText="Hủy" variant="danger" onConfirm={doDelete} onCancel={() => setDeleteModal({ open: false, id: "", name: "" })} />
    </div>
  );
}
