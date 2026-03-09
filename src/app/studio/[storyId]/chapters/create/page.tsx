"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;

  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [content, setContent] = useState("");
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
        body: JSON.stringify({ title, slug, chapterNumber, content }),
      });
      router.push(`/studio/${storyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo chương thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">
          <Plus size={24} /> Thêm chương mới
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
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
    </div>
  );
}
