"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, BookOpen, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface AdminStory {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
  author: { id: string; displayName: string; username: string };
  _count: { chapters: number };
}

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();
  const [rejectModal, setRejectModal] = useState<{ open: boolean; storyId: string }>({ open: false, storyId: "" });

  useEffect(() => {
    setLoading(true);
    apiFetch<AdminStory[]>("/admin/stories")
      .then((res) => setStories(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (storyId: string) => {
    setActionLoading(storyId);
    try {
      await apiFetch(`/admin/stories/${storyId}/approve`, { method: "PUT" });
      setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, isPublished: true } : s)));
      showToast("Đã duyệt truyện", "success");
    } catch {
      showToast("Duyệt truyện thất bại", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const executeReject = async () => {
    const { storyId } = rejectModal;
    if (!storyId) return;
    setRejectModal({ open: false, storyId: "" });
    setActionLoading(storyId);
    try {
      await apiFetch(`/admin/stories/${storyId}/reject`, { method: "PUT" });
      setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, isPublished: false } : s)));
      showToast("Đã từ chối truyện", "success");
    } catch {
      showToast("Từ chối truyện thất bại", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = stories.filter((s) => {
    const matchFilter = filter === "all" ? true : filter === "pending" ? !s.isPublished : s.isPublished;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.author?.displayName || s.author?.username || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = stories.filter((s) => !s.isPublished).length;
  const publishedCount = stories.filter((s) => s.isPublished).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <BookOpen size={24} className="text-emerald-500" /> Quản lý Nội dung
      </h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm truyện..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-surface-elevated rounded-lg p-1 border border-border-brand">
          {([
            { key: "all" as const, label: "Tất cả", count: stories.length },
            { key: "pending" as const, label: "Chờ duyệt", count: pendingCount },
            { key: "published" as const, label: "Đã duyệt", count: publishedCount },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filter === t.key ? "bg-surface-brand text-text-primary shadow-sm border border-border-brand" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label} ({t.count})
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
                  <th className="w-[25%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Tiêu đề</th>
                  <th className="w-[15%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Tác giả</th>
                  <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Loại</th>
                  <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Chương</th>
                  <th className="w-[15%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Trạng thái</th>
                  <th className="w-[15%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Ngày tạo</th>
                  <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand">
                {filtered.map((story) => (
                  <tr key={story.id} className={`hover:bg-surface-elevated transition-colors ${!story.isPublished ? "bg-amber-500/5" : ""}`}>
                    <td className="px-5 py-4 align-middle">
                      <div className="text-sm font-semibold text-text-primary leading-tight">{story.title}</div>
                      {story.description && (
                        <p className="text-xs text-text-muted truncate max-w-[260px] mt-1">{story.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle text-sm text-text-secondary">
                      {story.author?.displayName || story.author?.username}
                    </td>
                    <td className="px-5 py-4 align-middle text-left">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400">
                        {story.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle text-left text-sm text-text-secondary">
                      {story._count?.chapters || 0}
                    </td>
                    <td className="px-5 py-4 align-middle text-left">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        story.isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {story.isPublished ? <><CheckCircle size={12} /> Đã duyệt</> : <><Eye size={12} /> Chờ duyệt</>}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle text-left text-sm text-text-muted">
                      {new Date(story.createdAt).toLocaleDateString("vi")}
                    </td>
                    <td className="px-5 py-4 align-middle text-left">
                      <div className="flex items-center justify-start gap-2">
                        <Link href={`/stories/${story.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all cursor-pointer" title="Xem chi tiết">
                          <Eye size={13} /> Xem
                        </Link>
                        {story.isPublished ? (
                          <button onClick={() => setRejectModal({ open: true, storyId: story.id })} disabled={actionLoading === story.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40" title="Gỡ">
                            <XCircle size={13} /> Gỡ
                          </button>
                        ) : (
                          <button onClick={() => handleApprove(story.id)} disabled={actionLoading === story.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40" title="Duyệt">
                            <CheckCircle size={13} /> Duyệt
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-text-muted">
                      <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{filter === "pending" ? "Không có truyện nào chờ duyệt" : "Không có truyện nào."}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={rejectModal.open} title="Từ chối truyện" message="Bạn có chắc muốn từ chối truyện này? Truyện sẽ bị gỡ khỏi danh sách hiển thị công khai." confirmText="Xác nhận" cancelText="Hủy" variant="danger" onConfirm={executeReject} onCancel={() => setRejectModal({ open: false, storyId: "" })} />
    </div>
  );
}
