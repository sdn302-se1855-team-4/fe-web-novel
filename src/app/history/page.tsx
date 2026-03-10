"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, BookOpen, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./history.module.css";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop";

interface HistoryItem {
  id: string;
  readAt: string;
  progress: number;
  story: {
    id: string;
    title: string;
    coverImage?: string;
    type?: string;
    author?: { id: string; displayName?: string; username?: string };
    _count?: { chapters: number };
  };
  chapter: { id: string; title: string; chapterNumber: number };
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    apiFetch<HistoryItem[]>("/reading-history/me?limit=50")
      .then((res) => setHistory(Array.isArray(res) ? res : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_COVER) {
      target.src = DEFAULT_COVER;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return d.toLocaleDateString("vi");
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className={styles.pageTitle}>
          <Clock size={24} /> Lịch sử đọc
        </h1>

        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.item}>
                <div
                  className="skeleton"
                  style={{
                    width: 64,
                    height: 86,
                    borderRadius: "var(--radius-sm)",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 16, width: "60%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 12, width: "40%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 4, width: "100%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className={styles.list}>
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}`}
                className={styles.item}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.story.coverImage || DEFAULT_COVER}
                  alt={item.story.title}
                  className={styles.cover}
                  onError={handleImageError}
                />
                <div className={styles.info}>
                  <div className={styles.titleRow}>
                    <span className={styles.title}>{item.story.title}</span>
                    {item.story.type && (
                      <span className={styles.typeBadge}>
                        {item.story.type}
                      </span>
                    )}
                  </div>
                  <span className={styles.chapterText}>
                    Chương {item.chapter.chapterNumber}: {item.chapter.title}
                  </span>
                  <div className={styles.metaRow}>
                    <span className={styles.author}>
                      {item.story.author?.displayName ||
                        item.story.author?.username ||
                        "Unknown"}
                    </span>
                    <span className={styles.time}>
                      {formatDate(item.readAt)}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                </div>
                <ChevronRight size={18} className={styles.arrow} />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <BookOpen size={48} />
            <p>Chưa có lịch sử đọc. Hãy bắt đầu đọc truyện nào!</p>
            <Link href="/stories" className="btn btn-primary">
              Khám phá truyện
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
