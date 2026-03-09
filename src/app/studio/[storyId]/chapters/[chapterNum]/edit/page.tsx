"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";

interface ChapterDetail {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  isPremium?: boolean;
  price?: number;
}

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;
  const chapterNum = Number(params.chapterNum);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    apiFetch<ChapterDetail>(
      `/stories/${storyId}/chapters/${chapterNum}?skipView=true`,
    )
      .then((ch) => {
        setTitle(ch.title);
        setContent(ch.content);
        setIsPremium(!!ch.isPremium);
        setPrice(ch.price || 0);
      })
      .catch(() => {
        showToast("Không tìm thấy chương 😢", "error");
        router.push(`/studio/${storyId}`);
      })
      .finally(() => setLoading(false));
  }, [storyId, chapterNum, router, showToast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/stories/${storyId}/chapters/${chapterNum}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          content,
          isPremium,
          price: isPremium ? price : 0,
        }),
      });
      showToast("Lưu chương thành công!", "success");
      router.push(`/studio/${storyId}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Sửa chương thất bại",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 800 }}>
          <div
            className="skeleton"
            style={{ height: 40, width: "50%", marginBottom: 24 }}
          />
          <div className="skeleton" style={{ height: 400, width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 800 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <Link href={`/studio/${storyId}`} className="btn-icon">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="section-title" style={{ margin: 0 }}>
            Sửa Chương {chapterNum}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
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
      </div>
    </div>
  );
}
