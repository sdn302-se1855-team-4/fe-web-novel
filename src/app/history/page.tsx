"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

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
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-medium text-sm group mb-6"
          >
            <div className="p-1.5 rounded-full bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
              <ChevronLeft size={16} />
            </div>
            Quay lại
          </button>
          
          <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-text-primary tracking-tight italic uppercase font-heading !mb-0">
            <Clock size={32} className="text-emerald-500" /> Lịch sử đọc
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 md:gap-6 p-4 md:p-5 bg-surface-brand border border-border-brand rounded-[2rem] no-underline text-inherit transition-all duration-300 hover:bg-surface-elevated hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 hover:translate-x-2 group">
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
          <div className="flex flex-col gap-4">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}`}
                className="flex items-center gap-4 md:gap-6 p-4 md:p-5 bg-surface-brand border border-border-brand rounded-[2rem] no-underline text-inherit transition-all duration-300 hover:bg-surface-elevated hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 hover:translate-x-2 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.story.coverImage || DEFAULT_COVER}
                  alt={item.story.title}
                  className="w-16 md:w-20 h-24 md:h-28 object-cover rounded-2xl shadow-lg flex-shrink-0"
                  onError={handleImageError}
                />
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-text-primary truncate">{item.story.title}</span>
                    {item.story.type && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500 text-white uppercase tracking-wider flex-shrink-0">
                        {item.story.type}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-text-secondary truncate">
                    Chương {item.chapter.chapterNumber}: {item.chapter.title}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-emerald-500/70">
                      {item.story.author?.displayName ||
                        item.story.author?.username ||
                        "Unknown"}
                    </span>
                    <span className="text-xs font-medium text-text-muted">
                      {formatDate(item.readAt)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden mt-3 max-w-[200px]">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-muted transition-colors duration-300 group-hover:text-emerald-500" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-24 text-text-muted text-center">
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
