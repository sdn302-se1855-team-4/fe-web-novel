"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, BookOpen, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;

  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [content, setContent] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      await apiFetch(`/stories/${storyId}/chapters`, {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          chapterNumber,
          content,
          isPremium,
          price: isPremium ? price : 0,
        }),
      });
      router.push(`/studio`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo chương thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại
        </button>
      </div>

      <h1 className="section-title">
        <Plus size={24} className="text-emerald-500" /> Thêm chương mới
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-lg pb-12">
        {error && <div className="error-text">{error}</div>}

        <div className="form-group">
          <label htmlFor="title" className="label">
            Tiêu đề chương *
          </label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Nhập tiêu đề chương"
          />
        </div>

        <div className="form-group">
          <label htmlFor="chapterNumber" className="label">
            Số chương *
          </label>
          <input
            id="chapterNumber"
            type="number"
            min="1"
            className="input"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content" className="label">
            Nội dung chương *
          </label>
          <textarea
            id="content"
            className="input textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Viết nội dung chương tại đây..."
            rows={20}
            style={{
              fontFamily: "var(--font-reader)",
              lineHeight: "var(--reader-line-height)",
              minHeight: 400,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1rem",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              style={{
                width: "1.25rem",
                height: "1.25rem",
                accentColor: "var(--color-primary)",
              }}
            />
            Bật kiếm tiền (Premium)
          </label>

          {isPremium && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Giá chương (Xu)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                placeholder="VD: 50"
                required={isPremium}
              />
              <p
                className="text-xs text-muted"
                style={{ marginTop: "0.5rem" }}
              >
                Người đọc phải trả số xu này để mở khóa chương.
              </p>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            "Đang tạo..."
          ) : (
            <>
              <BookOpen size={18} /> Đăng chương
            </>
          )}
        </button>
      </form>
    </div>
  );
}
