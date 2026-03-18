"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { countWords } from "@/lib/utils";
import { FileText } from "lucide-react";

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
      router.push(`/studio`);
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
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div
          className="skeleton"
          style={{ height: 40, width: "50%", marginBottom: 24 }}
        />
        <div className="skeleton" style={{ height: 400, width: "100%" }} />
      </div>
    );
  }

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
        Sửa Chương {chapterNum}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-lg pb-12">
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
                Người độ phải trả số xu này để mở khóa chương.
              </p>
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between mb-2 ml-1">
            <label htmlFor="content" className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
              Nội dung chương *
            </label>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 bg-surface-elevated/50 px-3 py-1 rounded-full border border-border-brand/30">
              <FileText size={12} className="text-emerald-500" /> {countWords(content)} chữ
            </p>
          </div>
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
  );
}
