"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Plus, BookOpen, Trash2, Edit, RefreshCw, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

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
      <div className="page-wrapper">
        <div className="container">
          <div
            className="skeleton"
            style={{ height: 32, width: "40%", marginBottom: 24 }}
          />
          <div className="skeleton" style={{ height: 200, width: "100%" }} />
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
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-md"
          style={{ marginBottom: "var(--spacing-2xl)" }}
        >
          {error && <div className="error-text">{error}</div>}
          <div className="form-group">
            <label htmlFor="title" className="label">
              Tiêu đề
            </label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description" className="label">
              Mô tả
            </label>
            <textarea
              id="description"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div
            className="form-group"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <label
              htmlFor="coverImage"
              className="label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Link ảnh bìa</span>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={handleRandomCover}
                style={{ fontSize: "0.7rem", color: "var(--color-primary)" }}
              >
                <RefreshCw size={12} /> Ngẫu nhiên
              </button>
            </label>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <input
                id="coverImage"
                className="input"
                style={{ flex: 1 }}
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                type="url"
              />
              {coverImage && (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="status" className="label">
              Trạng thái
            </label>
            <select
              id="status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ONGOING">Đang ra</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="HIATUS">Tạm dừng</option>
            </select>
          </div>
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: isPublished
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
              color: isPublished ? "#10b981" : "#f59e0b",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {isPublished
              ? "✅ Truyện đã được Admin duyệt và hiển thị trên trang Duyệt truyện"
              : "⏳ Truyện đang chờ Admin duyệt. Sau khi được duyệt sẽ hiển thị công khai."}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              "Đang lưu..."
            ) : (
              <>
                <Save size={18} /> Lưu thay đổi
              </>
            )}
          </button>
        </form>

        {/* Chapter Management */}
        <div className="flex items-center justify-between gap-6 mb-8 flex-wrap">
          <h2 className="section-title">
            <BookOpen size={22} /> Danh sách chương ({chapters.length})
          </h2>
          <Link
            href={`/studio/${storyId}/chapters/create`}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Thêm chương
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {chapters.length > 0 ? (
            chapters.map((ch) => (
              <div key={ch.id} className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-surface-brand border border-border-brand rounded-[2rem] md:rounded-[2.5rem] transition-all duration-300 hover:bg-surface-elevated hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-text-primary truncate">
                    Chương {ch.chapterNumber}: {ch.title}
                  </h3>
                  <div className="flex items-center gap-4 flex-wrap text-sm font-medium">
                    {ch.isPremium && (
                      <span className="badge badge-premium">Premium</span>
                    )}
                    {ch.createdAt && (
                      <span className="text-xs text-muted">
                        {new Intl.DateTimeFormat("vi").format(
                          new Date(ch.createdAt),
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-border-brand">
                  <Link
                    href={`/studio/${storyId}/chapters/${ch.chapterNumber}/edit`}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={14} /> Sửa
                  </Link>
                  <button
                    className="btn-icon"
                    onClick={() => confirmDeleteChapter(ch.chapterNumber)}
                    aria-label="Xóa chương"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p
              className="text-center text-muted"
              style={{ padding: "var(--spacing-2xl)" }}
            >
              Chưa có chương nào.
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Xóa chương"
        message={`Bạn có chắc muốn xóa chương ${deleteModal.chNum}? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={executeDeleteChapter}
        onCancel={() => setDeleteModal({ open: false, chNum: null })}
      />
    </div>
  );
}
