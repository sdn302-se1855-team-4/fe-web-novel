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
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [saving, setSaving] = useState(false);
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

  const onNameChange = (v: string) => { setName(v); if (!editId) setSlug(genSlug(v)); };

  const submit = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await apiFetch(`/admin/genres/${editId}`, { method: "PUT", body: JSON.stringify({ name: name.trim(), slug: slug.trim() }) });
        showToast("Đã cập nhật thể loại", "success");
      } else {
        await apiFetch("/admin/genres", { method: "POST", body: JSON.stringify({ name: name.trim(), slug: slug.trim() }) });
        showToast("Đã tạo thể loại mới", "success");
      }
      setName(""); setSlug(""); setEditId(null); fetchGenres();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const edit = (g: Genre) => { setEditId(g.id); setName(g.name); setSlug(g.slug); };
  const cancelEdit = () => { setEditId(null); setName(""); setSlug(""); };

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
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Layers size={24} className="text-amber-400" /> Quản lý Thể loại
      </h1>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
        {/* Create / Edit Form */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-700/50 bg-slate-800/30 overflow-visible relative">
          <input type="text" placeholder="Tên thể loại" className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all" value={name} onChange={(e) => onNameChange(e.target.value)} />
          <div className="relative group">
            <input type="text" placeholder="slug" className="w-44 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-sm text-slate-200 font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 cursor-help transition-colors">
              <HelpCircle size={14} />
              <div className="absolute top-full right-0 mt-2 w-64 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-300 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-100 leading-relaxed">
                <span className="font-bold text-white block mb-1">Slug là gì?</span>
                Dùng để tạo đường dẫn URL đẹp. Hệ thống sẽ <strong className="text-emerald-400">tự động tạo</strong> khi bạn nhập tên, hoặc bạn có thể <strong className="text-indigo-400">tùy chỉnh</strong> theo ý mình.
              </div>
            </div>
          </div>
          <button onClick={submit} disabled={saving || !name.trim()} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer">
            {editId ? <><Edit2 size={14} /> Cập nhật</> : <><Plus size={14} /> Thêm</>}
          </button>
          {editId && <button onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/40 transition-colors cursor-pointer">Hủy</button>}
        </div>

        {loading ? <div className="h-48 animate-pulse bg-slate-800/40" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tên thể loại</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Slug</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Số truyện</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {genres.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-white">{g.name}</td>
                    <td className="px-5 py-3 text-sm text-slate-400 font-mono">{g.slug}</td>
                    <td className="px-5 py-3"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">{g._count.stories} truyện</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => edit(g)} className="p-2 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Sửa"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteModal({ open: true, id: g.id, name: g.name })} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Xóa"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {genres.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500"><Layers size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Chưa có thể loại nào. Thêm thể loại đầu tiên!</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={deleteModal.open} title="Xóa thể loại" message={`Bạn có chắc muốn xóa thể loại "${deleteModal.name}"?`} confirmText="Xóa" cancelText="Hủy" variant="danger" onConfirm={doDelete} onCancel={() => setDeleteModal({ open: false, id: "", name: "" })} />
    </div>
  );
}
