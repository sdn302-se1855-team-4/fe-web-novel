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
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";

const THEMES = {
  light: {
    "--reader-bg": "#f9f7f2",
    "--reader-text": "#1a1a1a",
    "--reader-bar-bg": "rgba(255, 255, 255, 0.85)",
    "--reader-border": "rgba(0, 0, 0, 0.08)",
    "--reader-shadow": "rgba(0, 0, 0, 0.05)",
    "--reader-btn-hover": "#f0ede5",
    "--reader-accent": "#10b981",
  },
  dark: {
    "--reader-bg": "#0f1117",
    "--reader-text": "#e2e8f0",
    "--reader-bar-bg": "rgba(23, 25, 35, 0.85)",
    "--reader-border": "rgba(255, 255, 255, 0.1)",
    "--reader-shadow": "rgba(0, 0, 0, 0.3)",
    "--reader-btn-hover": "#171923",
    "--reader-accent": "#10b981",
  },
  sepia: {
    "--reader-bg": "#f1e7d0",
    "--reader-text": "#433422",
    "--reader-bar-bg": "rgba(234, 221, 192, 0.85)",
    "--reader-border": "rgba(67, 52, 34, 0.15)",
    "--reader-shadow": "rgba(67, 52, 34, 0.08)",
    "--reader-btn-hover": "#e6d8b9",
    "--reader-accent": "#8b4513",
  },
};

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
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
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
        apiFetch<Chapter[]>(`/stories/${storyId}/chapters`),
      ])
        .then(([chData, chaptersData]) => {
          setChapter(chData);
          const sortedChapters = Array.isArray(chaptersData) 
            ? [...chaptersData].sort((a, b) => a.chapterNumber - b.chapterNumber)
            : [];
          setAllChapters(sortedChapters);
          setTotalChapters(sortedChapters.length);

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
    const stored = localStorage.getItem("readerFontSize");
    if (stored) setFontSize(Number(stored));
    const storedTheme = localStorage.getItem("readerTheme") as any;
    if (storedTheme) setReaderTheme(storedTheme);
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
      const next = prev === "light" ? "sepia" : prev === "sepia" ? "dark" : "light";
      localStorage.setItem("readerTheme", next);
      return next;
    });
  };

  const navigateChapter = (num: number) => {
    router.push(`/stories/${storyId}/chapters/${num}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && chapterNumber > 1) {
        navigateChapter(chapterNumber - 1);
      } else if (e.key === "ArrowRight" && chapterNumber < totalChapters) {
        navigateChapter(chapterNumber + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapterNumber, totalChapters, storyId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-text)] font-sans flex flex-col transition-all duration-400" style={THEMES["light"] as any} data-reader-theme="light">
        <div className="max-w-[800px] mx-auto px-6 py-16 md:py-20 w-full">
          <div className="animate-pulse bg-gray-200/50 h-10 w-3/4 rounded-xl mx-auto mb-10" />
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200/30 h-4 rounded-full mb-4" style={{ width: `${85 + Math.random() * 15}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div 
      className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-text)] font-sans flex flex-col transition-all duration-400" 
      style={THEMES[readerTheme] as any} 
      data-reader-theme={readerTheme}
    >
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-[var(--reader-bar-bg)] border-b border-[var(--reader-border)] backdrop-blur-md shadow-sm"
      >
        <Link href={`/stories/${storyId}`} className="flex items-center gap-3 text-[var(--reader-text)] no-underline font-bold text-sm hover:-translate-x-1 transition-transform max-w-[40%]">
          <ChevronLeft size={18} />
          <span className="truncate tracking-tight">
            {chapter.story?.title || "Trở lại"}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button className="btn-icon" onClick={() => changeFontSize(-2)} aria-label="Giảm chữ">
            <Minus size={16} />
          </button>
          <span className="text-[10px] font-bold opacity-80 text-center min-w-[40px]">{fontSize}PX</span>
          <button className="btn-icon" onClick={() => changeFontSize(2)} aria-label="Tăng chữ">
            <Plus size={16} />
          </button>
          <button className="btn-icon" onClick={cycleTheme} aria-label="Đổi nền">
            {readerTheme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </motion.div>

      {/* Chapter Content */}
      <AnimatePresence mode="wait">
        <motion.article 
          key={chapter.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="max-w-[800px] mx-auto px-6 py-16 md:py-20 w-full" 
          style={{ fontSize: `${fontSize}px` }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center leading-tight">
            Chương {chapter.chapterNumber}: {chapter.title}
            {chapter.isPremium && (
              <span className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-black tracking-wider ml-3 shadow-md">
                <Coins size={14} /> PREMIUM
              </span>
            )}
          </h1>

          {/* Inline Navigation Bar */}
          <div className="flex items-center justify-center gap-3 mb-10 w-full">
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
              disabled={chapterNumber <= 1}
              onClick={() => navigateChapter(chapterNumber - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            
            <select 
              className="bg-[var(--reader-bar-bg)] border border-[var(--reader-border)] text-[var(--reader-text)] px-4 h-10 rounded-xl font-semibold text-sm cursor-pointer outline-none backdrop-blur-md max-w-[280px]"
              value={chapterNumber}
              onChange={(e) => navigateChapter(Number(e.target.value))}
            >
              {allChapters.map(ch => (
                <option key={ch.id} value={ch.chapterNumber}>
                  Chương {ch.chapterNumber}: {ch.title}
                </option>
              ))}
            </select>

            <button 
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
              disabled={chapterNumber >= totalChapters}
              onClick={() => navigateChapter(chapterNumber + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {chapter.isPremium && chapter.isLocked ? (
            <div className="flex flex-col items-center gap-6 p-12 text-center bg-[var(--reader-bar-bg)] rounded-[2.5rem] border border-[var(--reader-border)] my-12 shadow-md">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 border-2 border-amber-200">
                <Lock size={40} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold">Mở khóa nội dung Premium</h2>
              <p className="text-base opacity-80">Chương này cần <strong>{chapter.price?.toLocaleString("vi") || 0} xu</strong> để tiếp tục đọc.</p>
              <button
                className="btn btn-primary w-full max-w-xs h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 border-none shadow-lg shadow-amber-500/20 text-white font-black text-lg"
                disabled={purchasing}
                onClick={async () => {
                  setPurchasing(true);
                  try {
                    await apiFetch("/wallet/purchase-chapter", {
                      method: "POST",
                      body: JSON.stringify({ storyId, chapterId: chapter.id }),
                    });
                    window.location.reload();
                  } catch (err: any) {
                    showToast(err.message || "Lỗi mua chương", "error");
                  }
                  setPurchasing(false);
                }}
              >
                {purchasing ? "ĐANG XỬ LÝ..." : `MỞ KHÓA (${chapter.price} XU)`}
              </button>
              <Link href="/wallet" className="text-sm text-[var(--reader-accent)] font-bold">
                Nạp thêm xu vào ví →
              </Link>
            </div>
          ) : (
            <div
              className={
                chapter.story?.type === "MANGA" || chapter.story?.type === "COMIC"
                  ? "flex flex-col items-center w-full max-w-[1000px] mx-auto [&_img]:max-w-full [&_img]:h-auto [&_img]:shadow-md [&_img]:mb-0.5"
                  : "font-serif leading-relaxed break-words whitespace-pre-wrap [&_p]:mb-6"
              }
              dangerouslySetInnerHTML={{ __html: chapter.content || "" }}
            />
          )}
        </motion.article>
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex items-center justify-center max-w-[800px] w-full mx-auto px-6 pb-16 gap-3">
        <button 
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
          disabled={chapterNumber <= 1}
          onClick={() => navigateChapter(chapterNumber - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        
        <select 
          className="bg-[var(--reader-bar-bg)] border border-[var(--reader-border)] text-[var(--reader-text)] px-4 h-10 rounded-xl font-semibold text-sm cursor-pointer outline-none backdrop-blur-md max-w-[280px]"
          value={chapterNumber}
          onChange={(e) => navigateChapter(Number(e.target.value))}
        >
          {allChapters.map(ch => (
            <option key={ch.id} value={ch.chapterNumber}>
              Chương {ch.chapterNumber}: {ch.title}
            </option>
          ))}
        </select>

        <button 
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
          disabled={chapterNumber >= totalChapters}
          onClick={() => navigateChapter(chapterNumber + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    </div>
  );
}
