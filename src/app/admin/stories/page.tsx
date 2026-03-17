"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, BookOpen, Search, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [search, setSearch] = useState("");
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

  const fetchStories = () => {
    setLoading(true);
    apiFetch<AdminStory[]>("/admin/stories")
      .then((res) => setStories(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStories();
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
      const res = await apiFetch<AdminChapter[]>(`/admin/stories/${storyId}/chapters`);
      setChapters(res);
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
      showToast("Đã từ chối truyện", "success");
    } catch {
      showToast("Từ chối truyện thất bại", "error");
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
      await apiFetch(`/admin/stories/${storyId}`, { method: "DELETE" });
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      if (expandedStory === storyId) {
        setExpandedStory(null);
        setChapters([]);
      }
      showToast("Đã xóa truyện", "success");
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
                  <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Tác giả</th>
                  <th className="w-[8%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Loại</th>
                  <th className="w-[8%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Chương</th>
                  <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Trạng thái</th>
                  <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Ngày tạo</th>
                  <th className="w-[23%] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand">
                {filtered.map((story) => (
                  <Fragment key={story.id}>
                    <tr className={`hover:bg-surface-elevated transition-colors ${!story.isPublished ? "bg-amber-500/5" : ""}`}>
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
                        <div className="flex items-center justify-start gap-2 flex-wrap">
                          <Link href={`/stories/${story.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all cursor-pointer" title="Xem chi tiết">
                            <Eye size={13} /> Xem
                          </Link>
                          {story.isPublished ? (
                            <button onClick={() => setRejectModal({ open: true, storyId: story.id })} disabled={actionLoading === story.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer disabled:opacity-40" title="Gỡ">
                              <XCircle size={13} /> Gỡ
                            </button>
                          ) : (
                            <button onClick={() => handleApprove(story.id)} disabled={actionLoading === story.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40" title="Duyệt">
                              <CheckCircle size={13} /> Duyệt
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteStoryModal({ open: true, storyId: story.id, title: story.title })}
                            disabled={actionLoading === story.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40"
                            title="Xóa truyện"
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                          {(story._count?.chapters || 0) > 0 && (
                            <button
                              onClick={() => toggleExpand(story.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                expandedStory === story.id
                                  ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                                  : "text-text-secondary border-border-brand hover:bg-surface-elevated"
                              }`}
                              title="Quản lý chương"
                            >
                              {expandedStory === story.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              Chương
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded chapter rows */}
                    {expandedStory === story.id && (
                      <tr key={`${story.id}-chapters`}>
                        <td colSpan={7} className="p-0">
                          <div className="bg-surface-elevated/30 border-t border-b border-border-brand">
                            {chaptersLoading ? (
                              <div className="flex items-center justify-center gap-2 py-8 text-text-muted">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Đang tải chương...</span>
                              </div>
                            ) : chapters.length === 0 ? (
                              <div className="py-8 text-center text-text-muted text-sm">Không có chương nào.</div>
                            ) : (
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-border-brand bg-surface-elevated/60">
                                    <th className="px-8 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Chương</th>
                                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Tiêu đề</th>
                                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Số từ</th>
                                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Lượt xem</th>
                                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Trạng thái</th>
                                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Hành động</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border-brand/50">
                                  {chapters.map((ch) => (
                                    <tr key={ch.id} className={`hover:bg-surface-elevated/50 transition-colors ${!ch.isPublished ? "bg-amber-500/5" : ""}`}>
                                      <td className="px-8 py-3 text-sm text-text-primary font-medium">
                                        #{ch.chapterNumber}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-text-primary">
                                        <div className="flex items-center gap-2">
                                          {ch.title}
                                          {ch.isPremium && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">VIP</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-text-muted">{ch.wordCount?.toLocaleString() || 0}</td>
                                      <td className="px-4 py-3 text-sm text-text-muted">{ch.viewCount?.toLocaleString() || 0}</td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                          ch.isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                        }`}>
                                          {ch.isPublished ? <><CheckCircle size={10} /> Đã duyệt</> : <><Eye size={10} /> Chờ duyệt</>}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                          {ch.isPublished ? (
                                            <button
                                              onClick={() => setRejectChapterModal({ open: true, chapterId: ch.id, title: `Chương ${ch.chapterNumber}: ${ch.title}` })}
                                              disabled={chapterActionLoading === ch.id}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer disabled:opacity-40"
                                              title="Gỡ chương"
                                            >
                                              <XCircle size={11} /> Gỡ
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleApproveChapter(ch.id)}
                                              disabled={chapterActionLoading === ch.id}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40"
                                              title="Duyệt chương"
                                            >
                                              {chapterActionLoading === ch.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Duyệt
                                            </button>
                                          )}
                                          <button
                                            onClick={() => setDeleteChapterModal({ open: true, chapterId: ch.id, title: `Chương ${ch.chapterNumber}: ${ch.title}`, storyId: story.id })}
                                            disabled={chapterActionLoading === ch.id}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40"
                                            title="Xóa chương"
                                          >
                                            <Trash2 size={11} /> Xóa
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

      {/* Reject Story Modal */}
      <ConfirmModal isOpen={rejectModal.open} title="Từ chối truyện" message="Bạn có chắc muốn từ chối truyện này? Truyện sẽ bị gỡ khỏi danh sách hiển thị công khai." confirmText="Xác nhận" cancelText="Hủy" variant="danger" onConfirm={executeReject} onCancel={() => setRejectModal({ open: false, storyId: "" })} />

      {/* Delete Story Modal */}
      <ConfirmModal isOpen={deleteStoryModal.open} title="Xóa truyện vĩnh viễn" message={`Bạn có chắc muốn xóa truyện "${deleteStoryModal.title}"? Tất cả dữ liệu liên quan (chương, bình luận, đánh giá...) sẽ bị xóa vĩnh viễn và KHÔNG THỂ khôi phục.`} confirmText="Xóa vĩnh viễn" cancelText="Hủy" variant="danger" onConfirm={executeDeleteStory} onCancel={() => setDeleteStoryModal({ open: false, storyId: "", title: "" })} />

      {/* Reject Chapter Modal */}
      <ConfirmModal isOpen={rejectChapterModal.open} title="Gỡ chương" message={`Bạn có chắc muốn gỡ "${rejectChapterModal.title}"? Chương sẽ không còn hiển thị công khai.`} confirmText="Xác nhận" cancelText="Hủy" variant="danger" onConfirm={executeRejectChapter} onCancel={() => setRejectChapterModal({ open: false, chapterId: "", title: "" })} />

      {/* Delete Chapter Modal */}
      <ConfirmModal isOpen={deleteChapterModal.open} title="Xóa chương vĩnh viễn" message={`Bạn có chắc muốn xóa "${deleteChapterModal.title}"? Chương sẽ bị xóa vĩnh viễn và KHÔNG THỂ khôi phục.`} confirmText="Xóa vĩnh viễn" cancelText="Hủy" variant="danger" onConfirm={executeDeleteChapter} onCancel={() => setDeleteChapterModal({ open: false, chapterId: "", title: "", storyId: "" })} />
    </div>
  );
}
