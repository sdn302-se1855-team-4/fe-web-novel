"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Plus, BookOpen, Trash2, Edit, RefreshCw, ChevronLeft, Info, FileText, LayoutList } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  type?: string;
  status?: string;
  isPublished?: boolean;
}

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  isPremium?: boolean;
  createdAt?: string;
}

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("ONGOING");
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    chNum: number | null;
  }>({
    open: false,
    chNum: null,
  });

  const handleRandomCover = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setCoverImage(`https://picsum.photos/seed/${randomId}/400/600`);
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    Promise.all([
      apiFetch<Story>(`/stories/${storyId}?skipView=true`),
      apiFetch<Chapter[]>(`/stories/${storyId}/chapters`),
    ])
      .then(([s, ch]) => {
        setStory(s);
        setTitle(s.title);
        setDescription(s.description || "");
        setCoverImage(s.coverImage || "");
        setStatus(s.status || "ONGOING");
        setIsPublished(s.isPublished || false);
        setChapters(Array.isArray(ch) ? ch : []);
      })
      .catch(() => router.push("/studio"))
      .finally(() => setLoading(false));
  }, [storyId, router]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/stories/${storyId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          status,
          coverImage: coverImage || undefined,
        }),
      });
      showToast("Cập nhật thành công!", "success");
      // Navigate back to studio after successful save
      setTimeout(() => {
        router.push("/studio");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
      showToast("Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteChapter = (chNum: number) => {
    setDeleteModal({ open: true, chNum });
  };

  const executeDeleteChapter = async () => {
    const { chNum } = deleteModal;
    if (chNum === null) return;

    setDeleteModal({ open: false, chNum: null });
    try {
      await apiFetch(`/stories/${storyId}/chapters/${chNum}`, {
        method: "DELETE",
      });
      setChapters((prev) => prev.filter((ch) => ch.chapterNumber !== chNum));
      showToast(`Đã xóa chương ${chNum}`, "success");
    } catch {
      showToast("Xóa chương thất bại", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-4">
        <div className="w-24 h-6 skeleton rounded-lg mb-8" />
        <div className="max-w-[800px] mx-auto space-y-8">
           <div className="h-10 w-2/3 skeleton rounded-lg" />
           <div className="h-96 skeleton rounded-[2.5rem]" />
        </div>
      </div>
    );
  }
  if (!story) return null;

  return (
    <div className="min-h-screen pb-20">
      <div className="mb-8">
        <button 
          onClick={() => router.push("/studio")}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại Studio
        </button>
      </div>

      <div className="max-w-[850px] mx-auto">
        <h1 className="text-3xl font-black text-text-primary italic uppercase tracking-tighter mb-10 flex items-center gap-4">
          <Edit size={32} className="text-emerald-500" /> Chỉnh sửa tác phẩm
        </h1>

        {/* Edit Form Card */}
        <div className="bg-surface-brand border border-border-brand/50 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-black/5 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
          
          <form onSubmit={handleSave} className="space-y-8 relative">
            <h2 className="text-lg font-black text-text-primary uppercase tracking-wider flex items-center gap-3 mb-4">
              <Info size={20} className="text-emerald-500" /> Thông tin cơ bản
            </h2>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Tiêu đề tác phẩm</label>
                <input
                  id="title"
                  className="input h-14 rounded-2xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                <textarea
                  id="description"
                  className="input min-h-[160px] py-4 rounded-2xl resize-none leading-relaxed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="coverImage" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex justify-between">
                    Link ảnh bìa
                    <button
                      type="button"
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors uppercase tracking-tight"
                      onClick={handleRandomCover}
                    >
                      <RefreshCw size={12} /> Ngẫu nhiên
                    </button>
                  </label>
                  <div className="flex gap-3">
                    <input
                      id="coverImage"
                      className="input h-14 flex-1 rounded-2xl"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://..."
                      type="url"
                    />
                    {coverImage && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-border-brand bg-surface-elevated shrink-0 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Trạng thái phát hành</label>
                  <select
                    id="status"
                    className="input h-14 appearance-none rounded-2xl"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ONGOING">Đang ra</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="HIATUS">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div className={cn(
                "p-5 rounded-2xl border-2 flex items-start gap-4 transition-all duration-300",
                isPublished 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/5" 
                  : "bg-amber-500/5 border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/5"
              )}>
                 <div className={cn("p-1.5 rounded-full", isPublished ? "bg-emerald-500/20" : "bg-amber-500/20")}>
                   <Info size={16} />
                 </div>
                 <div className="flex-1">
                   {isPublished
                     ? <p className="text-sm font-bold leading-tight">Truyện đã được duyệt và hiển thị công khai trên hệ thống.</p>
                     : <p className="text-sm font-bold leading-tight">Tác phẩm đang chờ kiểm duyệt. Sau khi Admin phê duyệt, nội dung sẽ được xuất bản rộng rãi.</p>
                   }
                 </div>
              </div>

              <button type="submit" className="btn btn-primary w-full h-16 text-lg uppercase tracking-widest font-black italic shadow-xl shadow-emerald-500/20 mt-6" disabled={saving}>
                {saving ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    <Save size={20} /> Lưu thay đổi tác phẩm
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Chapter Management Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full" />
              <LayoutList size={28} className="text-blue-500" /> Danh sách chương ({chapters.length})
            </h2>
            <Link
              href={`/studio/${storyId}/chapters/create`}
              className="btn btn-primary px-8 rounded-2xl shadow-lg shadow-emerald-500/10 gap-2 shrink-0 h-12"
            >
              <Plus size={18} /> Thêm chương mới
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {chapters.length > 0 ? (
              chapters.map((ch, idx) => (
                <div key={ch.id} className="group flex flex-col md:flex-row md:items-center gap-6 p-6 bg-surface-brand border border-border-brand/60 rounded-[1.5rem] md:rounded-[2.5rem] transition-all hover:bg-surface-elevated hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5">
                  <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border-brand flex flex-col items-center justify-center shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all shadow-sm">
                    <span className="text-[10px] font-black text-text-muted uppercase leading-none mb-1">Chương</span>
                    <span className="text-lg font-black text-text-primary leading-none">{ch.chapterNumber}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-text-primary truncate transition-colors group-hover:text-blue-500">
                      {ch.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-text-muted mt-1">
                      {ch.isPremium && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] uppercase tracking-widest">Premium</span>
                      )}
                      {ch.createdAt && (
                        <span className="opacity-60">Cập nhật: {new Intl.DateTimeFormat("vi").format(new Date(ch.createdAt))}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-brand/40 justify-end">
                    <Link
                      href={`/studio/${storyId}/chapters/${ch.chapterNumber}/edit`}
                      className="btn btn-outline btn-sm border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-5 rounded-xl gap-2 active:scale-95"
                    >
                      <Edit size={14} /> Sửa
                    </Link>
                    <button
                      className="p-2.5 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95"
                      onClick={() => confirmDeleteChapter(ch.chapterNumber)}
                      aria-label="Xóa chương"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center bg-surface-brand/40 border-2 border-dashed border-border-brand/60 rounded-[2.5rem] flex flex-col items-center gap-4">
                 <FileText size={48} className="text-text-muted opacity-20" />
                 <div>
                   <h5 className="text-xl font-black text-text-muted uppercase tracking-tight">Chưa có chương truyện</h5>
                   <p className="text-text-muted/60 font-bold mt-2">Bắt đầu hành trình sáng tác bằng cách thêm chương đầu tiên!</p>
                 </div>
                 <Link
                    href={`/studio/${storyId}/chapters/create`}
                    className="btn btn-outline border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 px-8 rounded-xl h-11 mt-2"
                  >
                    <Plus size={18} /> Thêm chương ngay
                  </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Xóa chương truyện"
        message={`Bạn có chắc muốn xóa chương ${deleteModal.chNum}? Hành động này sẽ xóa vĩnh viễn nội dung chương và không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={executeDeleteChapter}
        onCancel={() => setDeleteModal({ open: false, chNum: null })}
      />
    </div>
  );
}
