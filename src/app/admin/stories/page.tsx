"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, BookOpen, Search, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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

interface AdminChapter {
  id: string;
  title: string;
  chapterNumber: number;
  isPublished: boolean;
  wordCount: number;
  viewCount: number;
  isPremium: boolean;
  createdAt: string;
}

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();
  const [rejectModal, setRejectModal] = useState<{ open: boolean; storyId: string }>({ open: false, storyId: "" });
  const [deleteStoryModal, setDeleteStoryModal] = useState<{ open: boolean; storyId: string; title: string }>({ open: false, storyId: "", title: "" });

  // Chapter management state
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterActionLoading, setChapterActionLoading] = useState<string | null>(null);
  const [deleteChapterModal, setDeleteChapterModal] = useState<{ open: boolean; chapterId: string; title: string; storyId: string }>({ open: false, chapterId: "", title: "", storyId: "" });
  const [rejectChapterModal, setRejectChapterModal] = useState<{ open: boolean; chapterId: string; title: string }>({ open: false, chapterId: "", title: "" });

  const fetchStories = (cursor: string | null = null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    const url = `/admin/stories?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
    apiFetch<{ data: AdminStory[]; pagination?: { nextCursor?: string | null } }>(url)
      .then((res) => {
        const data = Array.isArray(res) ? res : (res as { data: AdminStory[] }).data || [];
        const pagination = (res as { pagination?: { nextCursor?: string | null } }).pagination || { nextCursor: null };
        
        if (cursor) {
          setStories((prev) => [...prev, ...data]);
        } else {
          setStories(data);
        }
        
        setNextCursor(pagination.nextCursor || null);
        setHasMore(!!pagination.nextCursor);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    fetchStories(null);
  }, []);

  // Fetch chapters when expanding a story
  const toggleExpand = async (storyId: string) => {
    if (expandedStory === storyId) {
      setExpandedStory(null);
      setChapters([]);
      return;
    }
    setExpandedStory(storyId);
    setChaptersLoading(true);
    try {
      const res = await apiFetch<{ data: AdminChapter[] }>(`/admin/stories/${storyId}/chapters`);
      const data = Array.isArray(res) ? res : (res as { data: AdminChapter[] }).data || [];
      setChapters(data);
    } catch {
      showToast("Không thể tải danh sách chương", "error");
      setChapters([]);
    } finally {
      setChaptersLoading(false);
    }
  };

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
      showToast("Đã gỡ truyện", "success");
    } catch {
      showToast("Gỡ truyện thất bại", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const executeDeleteStory = async () => {
    const { storyId } = deleteStoryModal;
    if (!storyId) return;
    setDeleteStoryModal({ open: false, storyId: "", title: "" });
    setActionLoading(storyId);
    try {
      // Correct API for deleting story: DELETE /admin/stories/:id
      await apiFetch(`/admin/stories/${storyId}`, { method: "DELETE" });
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      if (expandedStory === storyId) {
        setExpandedStory(null);
        setChapters([]);
      }
      showToast("Đã xóa truyện vĩnh viễn", "success");
    } catch {
      showToast("Xóa truyện thất bại", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Chapter actions
  const handleApproveChapter = async (chapterId: string) => {
    setChapterActionLoading(chapterId);
    try {
      await apiFetch(`/admin/chapters/${chapterId}/approve`, { method: "PUT" });
      setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, isPublished: true } : c)));
      showToast("Đã duyệt chương", "success");
    } catch {
      showToast("Duyệt chương thất bại", "error");
    } finally {
      setChapterActionLoading(null);
    }
  };

  const executeRejectChapter = async () => {
    const { chapterId } = rejectChapterModal;
    if (!chapterId) return;
    setRejectChapterModal({ open: false, chapterId: "", title: "" });
    setChapterActionLoading(chapterId);
    try {
      await apiFetch(`/admin/chapters/${chapterId}/reject`, { method: "PUT" });
      setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, isPublished: false } : c)));
      showToast("Đã gỡ chương", "success");
    } catch {
      showToast("Gỡ chương thất bại", "error");
    } finally {
      setChapterActionLoading(null);
    }
  };

  const executeDeleteChapter = async () => {
    const { chapterId, storyId } = deleteChapterModal;
    if (!chapterId) return;
    setDeleteChapterModal({ open: false, chapterId: "", title: "", storyId: "" });
    setChapterActionLoading(chapterId);
    try {
      await apiFetch(`/admin/chapters/${chapterId}`, { method: "DELETE" });
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      // Update chapter count in stories list
      setStories((prev) => prev.map((s) => s.id === storyId ? { ...s, _count: { ...s._count, chapters: s._count.chapters - 1 } } : s));
      showToast("Đã xóa chương", "success");
    } catch {
      showToast("Xóa chương thất bại", "error");
    } finally {
      setChapterActionLoading(null);
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
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
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
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === t.key ? "bg-surface-brand text-emerald-500 shadow-sm border border-border-brand" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table container */}
      <div className="rounded-2xl bg-surface-brand border border-border-brand overflow-hidden shadow-xl shadow-black/20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
            <p className="text-sm font-bold text-text-muted animate-pulse uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-brand bg-surface-elevated/50">
                  <th className="w-[35%] px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-muted">Tiêu đề & Tác giả</th>
                  <th className="w-[10%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-text-muted">Loại</th>
                  <th className="w-[10%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-text-muted">Chương</th>
                  <th className="w-[15%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-text-muted">Trạng thái</th>
                  <th className="w-[15%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-text-muted">Ngày tạo</th>
                  <th className="w-[15%] px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-text-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand">
                {filtered.map((story) => (
                  <Fragment key={story.id}>
                    <tr className={`group transition-all duration-200 hover:bg-surface-elevated/80 ${!story.isPublished ? "bg-amber-500/3" : ""}`}>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <Link href={`/stories/${story.id}`} className="text-sm font-bold text-text-primary hover:text-emerald-500 transition-colors cursor-pointer leading-tight">
                            {story.title}
                          </Link>
                          <div className="flex items-center gap-1.5 opacity-70">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">by</span>
                            <span className="text-xs font-semibold text-text-secondary">
                              {story.author?.displayName || story.author?.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                          {story.type}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <div className="inline-flex flex-col items-center px-3 py-1 rounded-lg bg-surface-elevated/50 border border-border-brand/30">
                          <span className="text-sm font-black text-text-primary">{story._count?.chapters || 0}</span>
                          <span className="text-[9px] text-text-muted font-bold uppercase tracking-tight">C.H.U.Ơ.N.G</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all uppercase tracking-tight ${
                          story.isPublished 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${story.isPublished ? "bg-emerald-500" : "bg-amber-500"} ${!story.isPublished ? "animate-pulse" : ""}`} />
                          {story.isPublished ? "Đã duyệt" : "Chờ duyệt"}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center text-xs text-text-muted font-bold tracking-tighter">
                        {new Date(story.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1 bg-surface-elevated/50 border border-border-brand/50 rounded-xl p-1 shadow-inner">
                            {story.isPublished ? (
                              <button onClick={() => setRejectModal({ open: true, storyId: story.id })} disabled={actionLoading === story.id} className="p-2 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-40" title="Gỡ truyện">
                                <XCircle size={18} />
                              </button>
                            ) : (
                              <button onClick={() => handleApprove(story.id)} disabled={actionLoading === story.id} className="p-2 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-40" title="Duyệt truyện">
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteStoryModal({ open: true, storyId: story.id, title: story.title })}
                              disabled={actionLoading === story.id}
                              className="p-2 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <button
                            onClick={() => toggleExpand(story.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              expandedStory === story.id
                                ? "bg-emerald-500 text-bg-primary border-emerald-500 shadow-lg shadow-emerald-500/30"
                                : "bg-surface-elevated text-text-secondary border-border-brand/50 hover:border-emerald-500 hover:text-emerald-500"
                            }`}
                            title="Xem chi tiết chương"
                          >
                            <BookOpen size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded chapter rows */}
                    {expandedStory === story.id && (
                      <tr key={`${story.id}-chapters`}>
                        <td colSpan={6} className="p-0 bg-surface-elevated/20">
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="overflow-hidden border-t border-border-brand/30"
                          >
                            <div className="p-8">
                              <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                  <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">
                                    Danh sách chương ({chapters.length})
                                  </h4>
                                </div>
                              </div>
                              
                              <div className="rounded-2xl border border-border-brand/40 bg-surface-brand overflow-hidden shadow-lg">
                                {chaptersLoading ? (
                                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Đang tải...</span>
                                  </div>
                                ) : chapters.length === 0 ? (
                                  <div className="py-20 text-center space-y-3">
                                    <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto border border-border-brand/50">
                                      <BookOpen size={24} className="opacity-20 text-text-primary" />
                                    </div>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Chưa có chương nào được đăng tải</p>
                                  </div>
                                ) : (
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="border-b border-border-brand/20 bg-surface-elevated/30">
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">#</th>
                                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">Tiêu đề chương</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-text-muted">Thống kê</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-text-muted">Trạng thái</th>
                                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-text-muted">Hành động</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-brand/10">
                                      {chapters.map((ch) => (
                                        <tr key={ch.id} className="hover:bg-surface-elevated/30 transition-colors group/ch">
                                          <td className="px-6 py-4 text-xs font-black text-emerald-500/50 group-hover/ch:text-emerald-500 transition-colors">{ch.chapterNumber}</td>
                                          <td className="px-4 py-4">
                                            <div className="flex flex-col gap-0.5">
                                              <span className="text-sm font-bold text-text-primary leading-tight">{ch.title}</span>
                                              {ch.isPremium && (
                                                <span className="w-fit px-1.5 py-0.5 rounded-[4px] text-[8px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase tracking-tighter">PREMIUM</span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted font-bold tracking-tight">
                                              <span className="flex items-center gap-1.5"><Eye size={12} className="text-emerald-500/50" /> {ch.viewCount?.toLocaleString()}</span>
                                              <span className="flex items-center gap-1.5"><Search size={12} className="text-indigo-500/50" /> {ch.wordCount?.toLocaleString()} từ</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                              ch.isPublished ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border border-amber-500/20"
                                            }`}>
                                              {ch.isPublished ? "Đã duyệt" : "Chờ duyệt"}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                              {ch.isPublished ? (
                                                <button
                                                  onClick={() => setRejectChapterModal({ open: true, chapterId: ch.id, title: `Chương ${ch.chapterNumber}: ${ch.title}` })}
                                                  disabled={chapterActionLoading === ch.id}
                                                  className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer disabled:opacity-40"
                                                  title="Gỡ chương"
                                                >
                                                  <XCircle size={16} />
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => handleApproveChapter(ch.id)}
                                                  disabled={chapterActionLoading === ch.id}
                                                  className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40"
                                                  title="Duyệt chương"
                                                >
                                                  <CheckCircle size={16} />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => setDeleteChapterModal({ open: true, chapterId: ch.id, title: `Chương ${ch.chapterNumber}: ${ch.title}`, storyId: story.id })}
                                                disabled={chapterActionLoading === ch.id}
                                                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40"
                                                title="Xóa vĩnh viễn"
                                              >
                                                <Trash2 size={16} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-surface-elevated rounded-3xl border border-border-brand/40 shadow-inner">
                          <BookOpen size={56} className="text-text-muted opacity-10" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-black text-text-primary uppercase tracking-widest">Không có dữ liệu</p>
                          <p className="text-sm text-text-muted">Không tìm thấy truyện nào phù hợp với bộ lọc hiện tại.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchStories(nextCursor)}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-surface-brand border border-border-brand text-text-secondary font-medium hover:bg-surface-hover transition-colors flex items-center justify-center min-w-[140px]"
          >
            {loadingMore ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : "Xem thêm"}
          </button>
        </div>
      )}

      {/* Reject Story Modal */}
      <ConfirmModal 
        isOpen={rejectModal.open} 
        title="Gỡ truyện xác nhận" 
        message="Bạn có chắc muốn gỡ phê duyệt truyện này? Truyện sẽ chuyển sang trạng thái 'Chờ duyệt' và tạm ẩn khỏi danh sách đọc công khai." 
        confirmText="Xác nhận gỡ" 
        cancelText="Hủy bỏ" 
        variant="danger" 
        onConfirm={executeReject} 
        onCancel={() => setRejectModal({ open: false, storyId: "" })} 
      />

      {/* Delete Story Modal */}
      <ConfirmModal 
        isOpen={deleteStoryModal.open} 
        title="XÓA TRUYỆN VĨNH VIỄN" 
        message={`CẢNH BÁO: Bạn đang thực hiện xóa vĩnh viễn truyện "${deleteStoryModal.title}". Hành động này sẽ gọi API [DELETE /admin/stories/${deleteStoryModal.storyId}] để xóa toàn bộ dữ liệu truyện và các chương liên quan. Hành động này KHÔNG THỂ KHÔI PHỤC.`} 
        confirmText="Xóa vĩnh viễn" 
        cancelText="Quay lại" 
        variant="danger" 
        onConfirm={executeDeleteStory} 
        onCancel={() => setDeleteStoryModal({ open: false, storyId: "", title: "" })} 
      />

      {/* Reject Chapter Modal */}
      <ConfirmModal 
        isOpen={rejectChapterModal.open} 
        title="Xác nhận gỡ chương" 
        message={`Gỡ phê duyệt "${rejectChapterModal.title}"? Chương sẽ không còn hiển thị với độc giả.`} 
        confirmText="Đồng ý gỡ" 
        cancelText="Không, giữ lại" 
        variant="danger" 
        onConfirm={executeRejectChapter} 
        onCancel={() => setRejectChapterModal({ open: false, chapterId: "", title: "" })} 
      />

      {/* Delete Chapter Modal */}
      <ConfirmModal 
        isOpen={deleteChapterModal.open} 
        title="Xóa chương vĩnh viễn" 
        message={`Bạn có chắc muốn xóa "${deleteChapterModal.title}"? Thao tác này sẽ gọi API [DELETE /admin/chapters/${deleteChapterModal.chapterId}]. Công việc này KHÔNG THỂ hoàn tác.`} 
        confirmText="Xóa vĩnh viễn" 
        cancelText="Hủy" 
        variant="danger" 
        onConfirm={executeDeleteChapter} 
        onCancel={() => setDeleteChapterModal({ open: false, chapterId: "", title: "", storyId: "" })} 
      />
    </div>
  );
}
