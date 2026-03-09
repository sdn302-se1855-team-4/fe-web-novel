"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Sun,
  Moon,
  Minus,
  Plus,
  Lock,
  Coins,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import styles from "./chapterReader.module.css";

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  isPremium?: boolean;
  price?: number;
  isLocked?: boolean;
  story?: { id: string; title: string; authorId?: string; type?: string };
}

export default function ChapterReaderPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterNumber = Number(params.number);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [readerTheme, setReaderTheme] = useState<"light" | "dark" | "sepia">(
    "light",
  );
  const [totalChapters, setTotalChapters] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      Promise.all([
        apiFetch<Chapter>(`/stories/${storyId}/chapters/${chapterNumber}`),
        apiFetch<{ length: number } | unknown[]>(
          `/stories/${storyId}/chapters`,
        ),
      ])
        .then(([chData, chaptersData]) => {
          setChapter(chData);
          const total = Array.isArray(chaptersData) ? chaptersData.length : 0;
          setTotalChapters(total);

          // Save reading history
          if (isLoggedIn() && chData?.id) {
            apiFetch("/reading-history", {
              method: "POST",
              body: JSON.stringify({
                storyId,
                chapterId: chData.id,
                progress: 0,
                lastPosition: 0,
              }),
            }).catch(() => {});
          }
        })
        .catch(() => router.push(`/stories/${storyId}`))
        .finally(() => setLoading(false));
    };
    fetchChapter();
  }, [storyId, chapterNumber, router]);

  useEffect(() => {
    Promise.resolve().then(() => {
      const stored = localStorage.getItem("readerFontSize");
      if (stored) setFontSize(Number(stored));
      const storedTheme = localStorage.getItem("readerTheme") as
        | "light"
        | "dark"
        | "sepia"
        | null;
      if (storedTheme) setReaderTheme(storedTheme);
    });
  }, []);

  const changeFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(28, Math.max(14, prev + delta));
      localStorage.setItem("readerFontSize", String(next));
      return next;
    });
  };

  const cycleTheme = () => {
    setReaderTheme((prev) => {
      const next =
        prev === "light" ? "sepia" : prev === "sepia" ? "dark" : "light";
      localStorage.setItem("readerTheme", next);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && chapterNumber > 1) {
        router.push(`/stories/${storyId}/chapters/${chapterNumber - 1}`);
      } else if (e.key === "ArrowRight" && chapterNumber < totalChapters) {
        router.push(`/stories/${storyId}/chapters/${chapterNumber + 1}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapterNumber, totalChapters, storyId, router]);

  if (loading) {
    return (
      <div className={styles.page} data-reader-theme="light">
        <div className={styles.content}>
          <div
            className="skeleton"
            style={{ height: 32, width: "60%", marginBottom: 24 }}
          />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: 16,
                width: `${70 + (i % 3) * 10}%`,
                marginBottom: 12,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className={styles.page} data-reader-theme={readerTheme}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link href={`/stories/${storyId}`} className={styles.backLink}>
          <ChevronLeft size={18} />
          <span className={styles.storyTitle}>
            {chapter.story?.title || "Trở lại"}
          </span>
        </Link>
        <div className={styles.controls}>
          <button
            className="btn-icon"
            onClick={() => changeFontSize(-2)}
            aria-label="Giảm cỡ chữ"
          >
            <Minus size={16} />
          </button>
          <span className={styles.fontSizeLabel}>{fontSize}px</span>
          <button
            className="btn-icon"
            onClick={() => changeFontSize(2)}
            aria-label="Tăng cỡ chữ"
          >
            <Plus size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={cycleTheme}
            aria-label="Đổi chế độ đọc"
          >
            {readerTheme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link
            href={`/stories/${storyId}`}
            className="btn-icon"
            aria-label="Danh sách chương"
          >
            <List size={18} />
          </Link>
        </div>
      </div>

      {/* Chapter Content */}
      <article className={styles.content} style={{ fontSize: `${fontSize}px` }}>
        <h1 className={styles.chapterHeading}>
          Chương {chapter.chapterNumber}: {chapter.title}
          {chapter.isPremium && (
            <span className={styles.premiumBadge}>
              <Coins size={12} /> Premium
            </span>
          )}
        </h1>

        {chapter.isPremium && chapter.isLocked ? (
          <div className={styles.paywall}>
            <Lock size={48} />
            <h2>Chương này yêu cầu mở khóa</h2>
            <p>
              Giá:{" "}
              <strong>{chapter.price?.toLocaleString("vi") || 0} xu</strong>
            </p>
            <button
              className="btn btn-primary"
              disabled={purchasing}
              onClick={async () => {
                setPurchasing(true);
                try {
                  await apiFetch("/wallet/purchase-chapter", {
                    method: "POST",
                    body: JSON.stringify({
                      storyId,
                      chapterId: chapter.id,
                    }),
                  });
                  window.location.reload();
                } catch (err: unknown) {
                  const msg =
                    err instanceof Error ? err.message : "Lỗi mua chương";
                  showToast(msg, "error");
                }
                setPurchasing(false);
              }}
            >
              {purchasing ? "Đang xử lý..." : `Mở khóa (${chapter.price} xu)`}
            </button>
            <Link href="/wallet" className={styles.paywallLink}>
              Nạp thêm xu →
            </Link>
          </div>
        ) : (
          <div
            className={
              chapter.story?.type === "MANGA" || chapter.story?.type === "COMIC"
                ? styles.mangaReader
                : styles.chapterText
            }
            dangerouslySetInnerHTML={{ __html: chapter.content || "" }}
          />
        )}
      </article>

      {/* Navigation */}
      <nav className={styles.chapterNav}>
        {chapterNumber > 1 ? (
          <Link
            href={`/stories/${storyId}/chapters/${chapterNumber - 1}`}
            className="btn btn-outline"
          >
            <ChevronLeft size={18} /> Chương trước
          </Link>
        ) : (
          <div />
        )}
        <Link href={`/stories/${storyId}`} className="btn btn-ghost">
          <List size={18} /> Mục lục
        </Link>
        {chapterNumber < totalChapters ? (
          <Link
            href={`/stories/${storyId}/chapters/${chapterNumber + 1}`}
            className="btn btn-primary"
          >
            Chương sau <ChevronRight size={18} />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
