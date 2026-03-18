"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Plus, Trash2, Edit, RefreshCw, ChevronLeft, Info, LayoutList, Upload, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
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
  isPublished?: boolean;
  isPremium?: boolean;
  createdAt?: string;
}

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChaptersExpanded, setIsChaptersExpanded] = useState(false);
  const chapterListRef = useRef<HTMLDivElement>(null);

  const visibleChapters = isChaptersExpanded ? chapters : chapters.slice(0, 5);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch<{ url: string }>("/upload/image", {
        method: "POST",
        body: formData,
      });
      setCoverImage(res.url);
      showToast("Tải ảnh lên thành công", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Tải ảnh thất bại", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
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
    <div className="page-wrapper" style={{ paddingTop: 0 }}>
      <div className="container" style={{ maxWidth: 800, marginTop: 0, paddingTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={() => router.push("/studio")}
            className="btn btn-ghost btn-sm"
            aria-label="Quay lại Writer Studio"
            style={{ padding: "0.5rem 0.75rem" }}
          >
            <ChevronLeft size={18} /> Quay lại
          </button>
        </div>
        <h1 className="section-title">
          <Edit size={24} /> Chỉnh sửa: {story.title}
        </h1>

        {/* Edit Form */}
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
                <div className="space-y-4">
                  <label htmlFor="coverImage" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex justify-between items-center">
                    <span>Link ảnh bìa</span>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="text-[10px] font-black uppercase text-text-muted hover:text-emerald-500 flex items-center gap-1 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                        Tải ảnh lên
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors uppercase tracking-tight"
                        onClick={handleRandomCover}
                      >
                        <RefreshCw size={12} /> Ngẫu nhiên
                      </button>
                    </div>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUploadImage}
                  />

                  <div className="flex gap-4">
                    <div className="w-24 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-border-brand/50 bg-surface-elevated flex items-center justify-center shrink-0 shadow-xl group relative">
                      {coverImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverImage}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <ImageIcon size={24} className="text-white/70" />
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={32} className="text-text-muted/30" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3 pt-1">
                      <input
                        id="coverImage"
                        className="input h-14 rounded-2xl text-sm"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="Hoặc dán link ảnh tại đây (https://...)"
                        type="url"
                      />
                      <p className="text-[10px] font-bold text-text-muted px-2">
                         Bạn có thể tải ảnh lên từ máy tính hoặc dán trực tiếp đường dẫn URL ảnh.
                      </p>
                    </div>
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
        <div className="space-y-8 scroll-mt-24" ref={chapterListRef}>
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
              <>
                {visibleChapters.map((ch) => (
                  <div key={ch.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 py-2 px-4 bg-surface-brand border border-border-brand rounded-xl md:rounded-2xl transition-all duration-300 hover:bg-surface-elevated hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="text-base font-bold text-text-primary truncate">
                      Chương {ch.chapterNumber}: {ch.title}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap text-sm font-medium">
                      {!ch.isPublished && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                          Chờ duyệt
                        </span>
                      )}
                      {ch.isPremium && (
                        <span className="badge badge-premium">Premium</span>
                      )}
                      {ch.createdAt && (
                        <span className="text-xs text-text-muted">
                          {new Intl.DateTimeFormat("vi").format(
                            new Date(ch.createdAt),
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-border-brand">
                    <Link
                      href={`/studio/${storyId}/chapters/${ch.chapterNumber}/edit`}
                      className="btn btn-outline btn-sm"
                    >
                      <Plus size={18} /> Sửa chương
                    </Link>
                    <button
                      onClick={() => confirmDeleteChapter(ch.chapterNumber)}
                      className="btn btn-ghost btn-sm text-rose-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                ))}

                {chapters.length > 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isChaptersExpanded) {
                        setIsChaptersExpanded(false);
                        const y = chapterListRef.current ? chapterListRef.current.getBoundingClientRect().top + window.scrollY - 100 : 0;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      } else {
                        setIsChaptersExpanded(true);
                      }
                    }}
                    className="btn btn-outline border-border-brand w-full py-4 mt-2 gap-2 rounded-2xl md:rounded-3xl hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-primary"
                  >
                    <span className="font-bold text-sm tracking-wide">{isChaptersExpanded ? "Thu gọn danh sách" : `Xem thêm ${chapters.length - 5} chương`}</span>
                    {isChaptersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-border-brand rounded-[2.5rem]">
                <p className="text-text-muted font-bold">Chưa có chương nào.</p>
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
