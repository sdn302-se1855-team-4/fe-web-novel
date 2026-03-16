"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Minus,
  Plus,
  Coins,
  Lock,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY) {
          setShowControls(false);
        } else {
          setShowControls(true);
        }
      } else {
        setShowControls(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleControls = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("select") ||
      target.closest("[data-no-toggle]")
    ) {
      return;
    }
    setShowControls((prev) => !prev);
  };

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
            ? [...chaptersData].sort(
                (a, b) => a.chapterNumber - b.chapterNumber,
              )
            : [];
          setAllChapters(sortedChapters);
          setTotalChapters(sortedChapters.length);

          if (isLoggedIn() && chData?.id && !chData.isLocked) {
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

  // Focus search input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  const changeFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(28, Math.max(14, prev + delta));
      localStorage.setItem("readerFontSize", String(next));
      return next;
    });
  };

  const filteredChapters = allChapters.filter(
    (ch) =>
      ch.chapterNumber.toString().includes(searchQuery) ||
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectChapter = (num: number) => {
    navigateChapter(num);
    setIsModalOpen(false);
    setSearchQuery("");
  };

  const navigateChapter = (num: number) => {
    if (num < 1 || num > totalChapters) return;
    router.push(`/stories/${storyId}/chapters/${num}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) {
        if (e.key === "Escape") {
          setIsModalOpen(false);
          setSearchQuery("");
        }
        return;
      }
      if (e.key === "ArrowLeft" && chapterNumber > 1) {
        navigateChapter(chapterNumber - 1);
      } else if (e.key === "ArrowRight" && chapterNumber < totalChapters) {
        navigateChapter(chapterNumber + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapterNumber, totalChapters, storyId, router, isModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-text)] font-sans flex flex-col transition-all duration-400" style={THEMES["light"] as any} data-reader-theme="light">
        <div className="max-w-[800px] mx-auto px-6 py-16 md:py-20 w-full">
          <div className="animate-pulse bg-gray-200/50 h-10 w-3/4 rounded-xl mx-auto mb-10" />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-black/5 h-4 rounded-full mb-4"
              style={{ width: `${85 + Math.random() * 15}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  const themes = {
    light: {
      bg: "bg-[#f9f7f2]",
      text: "text-[#1a1a1a]",
      bar: "bg-white",
      border: "border-black/10",
      shadow: "shadow-md shadow-black/5",
      btn: "bg-[#f0ede5] border-black/10 text-[#1a1a1a] hover:bg-[#e6e3d9] hover:text-emerald-600 hover:border-emerald-600/30",
      accent: "text-emerald-600",
      accentBg: "bg-emerald-600",
    },
    dark: {
      bg: "bg-[#0f1117]",
      text: "text-[#e2e8f0]",
      bar: "bg-[#171923]",
      border: "border-white/10",
      shadow: "shadow-2xl shadow-black/50",
      btn: "bg-[#1e212f] border-white/10 text-[#e2e8f0] hover:bg-[#2a2d3d] hover:text-emerald-400 hover:border-emerald-500/30",
      accent: "text-emerald-400",
      accentBg: "bg-emerald-500",
    },
    sepia: {
      bg: "bg-[#f1e7d0]",
      text: "text-[#433422]",
      bar: "bg-[#eaddc0]",
      border: "border-[#433422]/20",
      shadow: "shadow-md shadow-[#433422]/5",
      btn: "bg-[#e6d8b9] border-[#433422]/20 text-[#433422] hover:bg-[#decfa9] hover:text-[#8b4513] hover:border-[#8b4513]/30",
      accent: "text-[#8b4513]",
      accentBg: "bg-[#8b4513]",
    },
  };

  const currentTheme = themes[readerTheme];
  const currentChapterTitle = chapter
    ? `Chương ${chapterNumber}: ${chapter.title}`
    : `Chương ${chapterNumber}`;

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

          <div className={cn("w-px h-5 sm:h-6 mx-0.5 sm:mx-1", currentTheme.border)} />

          <button
            className={cn(
              "p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 border flex items-center justify-center scale-90 sm:scale-100",
              currentTheme.btn,
            )}
            onClick={() => router.push(`/stories/${storyId}`)}
            title="Thoát"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </motion.div>

      {/* Chapter Content — click to toggle controls */}
      <div className="flex-1 cursor-pointer pb-24" onClick={toggleControls}>
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
            <div className="flex items-center justify-center gap-3 mb-10 w-full" data-no-toggle>
              <button
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                disabled={chapterNumber <= 1}
                onClick={() => navigateChapter(chapterNumber - 1)}
              >
                <ChevronLeft size={20} className="sm:w-[22px] sm:h-[22px]" />
              </button>

              <button
                className="flex-1 min-w-0 h-10 flex items-center gap-2 px-4 rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] font-semibold text-sm cursor-pointer hover:bg-[var(--reader-btn-hover)] hover:border-[var(--reader-accent)] hover:text-[var(--reader-accent)] transition-all"
                onClick={() => setIsModalOpen(true)}
                title="Chọn chương"
              >
                <List size={16} className="flex-shrink-0 opacity-60" />
                <span className="truncate text-left">{currentChapterTitle}</span>
              </button>

              <button
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                disabled={chapterNumber >= totalChapters}
                onClick={() => navigateChapter(chapterNumber + 1)}
              >
                <ChevronRight size={20} className="sm:w-[22px] sm:h-[22px]" />
              </button>
            </div>

            {chapter.isPremium && chapter.isLocked ? (
              <div className="flex flex-col items-center gap-6 p-12 text-center bg-[var(--reader-bar-bg)] rounded-[2.5rem] border border-[var(--reader-border)] my-12 shadow-md" data-no-toggle>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 border-2 border-amber-200">
                  <Lock size={40} className="text-amber-600" />
                </div>
                <h2 className="text-xl font-bold">Mở khóa nội dung Premium</h2>
                <p className="text-base opacity-80">Chương này cần <strong>{chapter.price?.toLocaleString("vi") || 0} xu</strong> để tiếp tục đọc.</p>
                <button
                  className="w-full max-w-sm h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/30 text-white font-black text-lg transition-transform active:scale-95 disabled:opacity-50"
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
      </div>

      {/* Fixed Bottom Navigation — hide on scroll down, show on scroll up / click */}
      <motion.nav
        data-no-toggle
        className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--reader-bar-bg)] border-t border-[var(--reader-border)] backdrop-blur-md shadow-lg"
        animate={{ y: showControls ? 0 : "100%", opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-3 w-full max-w-[800px] mx-auto px-4 py-3">
          <button
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            disabled={chapterNumber <= 1}
            onClick={() => navigateChapter(chapterNumber - 1)}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            className="flex-1 min-w-0 h-10 flex items-center gap-2 px-4 rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] font-semibold text-sm cursor-pointer hover:bg-[var(--reader-btn-hover)] hover:border-[var(--reader-accent)] hover:text-[var(--reader-accent)] transition-all"
            onClick={() => setIsModalOpen(true)}
            title="Chọn chương"
          >
            <List size={16} className="flex-shrink-0 opacity-60" />
            <span className="truncate text-left">{currentChapterTitle}</span>
          </button>

          <button
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bar-bg)] text-[var(--reader-text)] cursor-pointer hover:not-disabled:bg-[var(--reader-btn-hover)] hover:not-disabled:border-[var(--reader-accent)] hover:not-disabled:text-[var(--reader-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            disabled={chapterNumber >= totalChapters}
            onClick={() => navigateChapter(chapterNumber + 1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.nav>

      {/* Chapter Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setIsModalOpen(false); setSearchQuery(""); }}
            />

            {/* Modal Panel */}
            <motion.div
              className="relative w-full sm:max-w-lg bg-[var(--reader-bar-bg)] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
              style={{ maxHeight: "75vh" }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[var(--reader-border)] opacity-60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--reader-border)]">
                <h2 className="font-bold text-base text-[var(--reader-text)]">Danh sách chương</h2>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--reader-text)] opacity-60 hover:opacity-100 hover:bg-[var(--reader-btn-hover)] transition-all"
                  onClick={() => { setIsModalOpen(false); setSearchQuery(""); }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-[var(--reader-border)]">
                <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bg)]">
                  <Search size={15} className="flex-shrink-0 opacity-40 text-[var(--reader-text)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tìm chương..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[var(--reader-text)] placeholder:opacity-40 outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="opacity-40 hover:opacity-80">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Chapter List */}
              <div className="overflow-y-auto flex-1 py-2">
                {filteredChapters.length === 0 ? (
                  <p className="text-center py-10 text-sm opacity-40 text-[var(--reader-text)]">Không tìm thấy chương</p>
                ) : (
                  filteredChapters.map((ch) => {
                    const isActive = ch.chapterNumber === chapterNumber;
                    return (
                      <button
                        key={ch.id}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-3 text-left transition-all",
                          isActive
                            ? "bg-[var(--reader-accent)]/10 text-[var(--reader-accent)]"
                            : "text-[var(--reader-text)] hover:bg-[var(--reader-btn-hover)]",
                        )}
                        onClick={() => handleSelectChapter(ch.chapterNumber)}
                      >
                        <span className={cn("text-xs font-bold w-8 flex-shrink-0 opacity-50", isActive && "opacity-100")}>
                          {ch.chapterNumber}
                        </span>
                        <span className="flex-1 text-sm font-medium truncate">
                          {ch.title}
                        </span>
                        {ch.isPremium && (
                          <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 font-bold">
                            PREMIUM
                          </span>
                        )}
                        {isActive && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--reader-accent)]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer info */}
              <div className="px-5 py-3 border-t border-[var(--reader-border)] text-center">
                <span className="text-xs opacity-40 text-[var(--reader-text)]">
                  {filteredChapters.length} / {allChapters.length} chương
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
