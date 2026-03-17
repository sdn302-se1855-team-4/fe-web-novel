"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pen, Plus, BookOpen, Eye, Edit, Trash2, ChevronLeft, LayoutDashboard } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface Story {
  id: string;
  title: string;
  coverImage?: string;
  type?: string;
  status?: string;
  viewCount?: number;
  _count?: { chapters: number };
  createdAt?: string;
  updatedAt?: string;
}

export default function StudioPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    storyId: string;
    title: string;
  }>({
    open: false,
    storyId: "",
    title: "",
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    apiFetch<Story[] | { data: Story[] }>("/stories/my")
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : (res as { data: Story[] }).data || [];
        setStories(list);
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [router]);

  const confirmDelete = (storyId: string, title: string) => {
    setDeleteModal({ open: true, storyId, title });
  };

  const executeDelete = async () => {
    const { storyId } = deleteModal;
    if (!storyId) return;

    setDeleteModal({ open: false, storyId: "", title: "" });
    try {
      await apiFetch(`/stories/${storyId}`, { method: "DELETE" });
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      showToast("Đã xóa truyện", "success");
    } catch {
      showToast("Xóa truyện thất bại", "error");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-medium text-sm group"
        >
          <div className="p-1.5 rounded-full bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={16} />
          </div>
          Quay lại
        </button>
      </div>

      <div className="flex items-center justify-between gap-6 mb-12 flex-wrap">
        <h1 className="section-title">
          <Pen size={24} /> Writer Studio
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/studio/analytics" className="btn btn-outline border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 group gap-2">
            <LayoutDashboard size={18} /> Thống kê & Doanh thu
          </Link>
          <Link href="/studio/create" className="btn btn-primary shadow-lg shadow-emerald-500/20 group gap-2">
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Tạo truyện mới
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-surface-brand border border-border-brand rounded-4xl md:rounded-[2.5rem] transition-all duration-300">
              <div
                className="skeleton"
                style={{
                  width: 64,
                  height: 80,
                  borderRadius: "var(--radius-md)",
                }}
              />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-6 w-[40%]" />
                <div className="skeleton h-4 w-[20%]" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length > 0 ? (
        <div className="flex flex-col gap-4">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-surface-brand border border-border-brand rounded-4xl md:rounded-[2.5rem] transition-all duration-300 hover:bg-surface-elevated hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="w-16 h-20 rounded-2xl overflow-hidden bg-surface-elevated flex items-center justify-center text-text-muted shadow-sm shrink-0">
                {story.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={24} className="opacity-20" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <h3 className="text-lg font-bold text-text-primary truncate">{story.title}</h3>
                <div className="flex items-center gap-4 flex-wrap text-sm font-medium">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      story.status === "COMPLETED" 
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                        : story.status === "ONGOING" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}
                  >
                    {story.status === "ONGOING"
                      ? "Đang ra"
                      : story.status === "COMPLETED"
                        ? "Hoàn thành"
                        : "Tạm dừng"}
                  </span>
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <Eye size={14} className="text-emerald-500/70" /> {Intl.NumberFormat("vi", { notation: "compact" }).format(story.viewCount || 0)}
                  </span>
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <BookOpen size={14} className="text-blue-500/70" /> {story._count?.chapters || 0} chương
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-border-brand">
                <Link
                  href={`/studio/${story.id}/chapters/create`}
                  className="btn btn-outline btn-sm border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 px-4 rounded-xl"
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Thêm chương</span>
                </Link>
                <Link
                  href={`/studio/${story.id}`}
                  className="btn btn-outline btn-sm border-border-brand hover:border-blue-500/40 hover:bg-blue-500/5 px-4 rounded-xl"
                >
                  <Edit size={14} /> <span className="hidden sm:inline">Chỉnh sửa</span>
                </Link>
                <button
                  className="p-2.5 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95"
                  onClick={() => confirmDelete(story.id, story.title)}
                  aria-label="Xóa truyện"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 py-24 text-text-muted text-center">
          <Pen size={48} />
          <h3 className="text-2xl font-bold text-text-primary tracking-tight">Chưa có truyện nào</h3>
          <p>Bắt đầu sáng tác truyện đầu tiên của bạn!</p>
          <Link href="/studio/create" className="btn btn-primary">
            <Plus size={18} /> Tạo truyện mới
          </Link>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Xóa truyện"
        message={`Bạn có chắc muốn xóa truyện "${deleteModal.title}"? Mọi dữ liệu và chương truyện sẽ bị xóa vĩnh viễn.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteModal({ open: false, storyId: "", title: "" })}
      />
    </div>
  );
}
