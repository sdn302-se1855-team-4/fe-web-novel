"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Minus,
  Plus,
  Sun,
  Moon,
  Coins,
  Lock,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Removed CSS module import as we've moved to Tailwind

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
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY) {
          setShowControls(false); // Scrolling down
        } else {
          setShowControls(true); // Scrolling up
        }
      } else {
        setShowControls(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleUI = (e: React.MouseEvent) => {
    // Don't toggle if clicking on links or buttons
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("select")
    ) {
      return;
    }
    setShowControls(!showControls);
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
      <div className="min-h-screen bg-[#f9f7f2] flex flex-col">
        <div className="max-w-[800px] mx-auto w-full px-4 sm:px-8 pt-24 pb-32">
          <div className="animate-pulse bg-black/5 h-10 w-3/4 rounded-xl mx-auto mb-10" />
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

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-500",
        currentTheme.bg,
        currentTheme.text,
      )}
      onClick={toggleUI}
    >
      {/* Top Bar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{
          y: showControls ? 0 : -80,
          opacity: showControls ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: "circOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-100 h-16 flex items-center justify-between px-4 sm:px-8 border-b backdrop-blur-2xl",
          currentTheme.bar,
          currentTheme.border,
          currentTheme.shadow,
        )}
        style={{ pointerEvents: showControls ? "auto" : "none" }}
      >
        <Link
          href={`/stories/${storyId}`}
          className="flex items-center gap-2 font-bold text-sm transition-transform hover:-translate-x-1 w-auto max-w-[30%] sm:max-w-[45%]"
        >
          <ChevronLeft
            size={20}
            className={cn(currentTheme.accent, "shrink-0")}
          />
          <span className="truncate tracking-tight hidden xs:block">
            {chapter.story?.title || "Trở lại"}
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-0.5 scale-90 sm:scale-100">
            <button
              className={cn(
                "p-1.5 sm:p-2 rounded-lg transition-all active:scale-90",
                currentTheme.btn,
              )}
              onClick={() => changeFontSize(-2)}
              aria-label="Giảm chữ"
            >
              <Minus size={14} className="sm:w-4 sm:h-4" />
            </button>
            <span className="w-8 sm:w-12 text-center text-[9px] sm:text-[10px] font-black opacity-60">
              {fontSize}
              <span className="hidden sm:inline">PX</span>
            </span>
            <button
              className={cn(
                "p-1.5 sm:p-2 rounded-lg transition-all active:scale-90",
                currentTheme.btn,
              )}
              onClick={() => changeFontSize(2)}
              aria-label="Tăng chữ"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          <button
            className={cn(
              "p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 border flex items-center justify-center scale-90 sm:scale-100",
              currentTheme.btn,
            )}
            onClick={cycleTheme}
            aria-label="Đổi nền"
          >
            {readerTheme === "dark" ? (
              <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />
            ) : (
              <Sun size={16} className="sm:w-[18px] sm:h-[18px]" />
            )}
          </button>

          <div
            className={cn(
              "w-px h-5 sm:h-6 mx-0.5 sm:mx-1",
              currentTheme.border,
            )}
          />

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

      {/* Chapter Content */}
      <AnimatePresence mode="wait">
        <motion.article
          key={chapter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="max-w-[800px] mx-auto w-full px-4 sm:px-8 pt-24 pb-32"
          style={{ fontSize: `${fontSize}px` }}
        >
          <header className="mb-8 sm:mb-12 text-center">
            <h1
              className={cn(
                "text-2xl sm:text-4xl font-extrabold mb-4 leading-tight tracking-tight",
                currentTheme.text,
              )}
            >
              Chương {chapter.chapterNumber}: {chapter.title}
            </h1>
            {chapter.isPremium && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30">
                <Coins size={14} /> Premium
              </div>
            )}
          </header>

          {/* Inline Navigation Bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-12 w-full">
            <button
              className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl sm:rounded-2xl border transition-all active:scale-90 disabled:opacity-30 shrink-0",
                currentTheme.btn,
              )}
              disabled={chapterNumber <= 1}
              onClick={() => navigateChapter(chapterNumber - 1)}
            >
              <ChevronLeft size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>

            <div className="flex-1 min-w-0 max-w-[400px]">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger
                  className={cn(
                    "w-full h-9 sm:h-11 px-2.5 sm:px-4 rounded-xl sm:rounded-2xl border font-bold text-[11px] sm:text-sm flex items-center justify-between gap-1.5 sm:gap-3 group transition-all",
                    currentTheme.bar,
                    currentTheme.border,
                    "hover:border-emerald-500/50",
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-3 overflow-hidden min-w-0">
                    <List
                      size={15}
                      className="text-emerald-500 shrink-0 group-hover:scale-110 transition-transform"
                    />
                    <span className="truncate opacity-90">
                      {chapter
                        ? `Chương ${chapter.chapterNumber}: ${chapter.title}`
                        : "Chọn chương..."}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className="opacity-40 group-hover:translate-x-0.5 transition-transform shrink-0"
                  />
                </DialogTrigger>
                <DialogContent
                  showCloseButton={false}
                  className={cn(
                    "max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl",
                    currentTheme.bar,
                    currentTheme.text,
                  )}
                >
                  <DialogHeader className="sr-only">
                    <DialogTitle>Danh sách chương</DialogTitle>
                  </DialogHeader>

                  <div className={cn("p-5 pb-4 border-b", currentTheme.border)}>
                    <div className="relative group">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 transition-transform group-focus-within:scale-110"
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder="Tìm số chương hoặc tên..."
                        className={cn(
                          "w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent outline-none ring-offset-0 focus:ring-2 ring-emerald-500/25 font-semibold transition-all",
                          currentTheme.border,
                          currentTheme.text,
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-3 no-scrollbar space-y-1">
                    {filteredChapters.length > 0 ? (
                      filteredChapters.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleSelectChapter(ch.chapterNumber)}
                          className={cn(
                            "w-full px-5 py-3.5 rounded-2xl flex items-center justify-between group transition-all text-left",
                            ch.chapterNumber === chapterNumber
                              ? "bg-emerald-500/15 text-emerald-500"
                              : cn(
                                  "hover:bg-black/5 dark:hover:bg-white/5",
                                  currentTheme.text,
                                ),
                          )}
                        >
                          <div className="flex items-center gap-5 overflow-hidden">
                            <span
                              className={cn(
                                "font-bold shrink-0 min-w-[32px] text-lg",
                                ch.chapterNumber === chapterNumber
                                  ? "text-emerald-500"
                                  : "opacity-30",
                              )}
                            >
                              {ch.chapterNumber}
                            </span>
                            <span className="truncate font-semibold tracking-tight opacity-95">
                              {ch.title}
                            </span>
                          </div>
                          {ch.chapterNumber === chapterNumber && (
                            <Check
                              size={18}
                              strokeWidth={3}
                              className="text-emerald-500 animate-in fade-in zoom-in duration-300"
                            />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-lg font-bold opacity-20">
                          Ốp la! Không tìm thấy chương...
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <button
              className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl sm:rounded-2xl border transition-all active:scale-90 disabled:opacity-30 shrink-0",
                currentTheme.btn,
              )}
              disabled={chapterNumber >= totalChapters}
              onClick={() => navigateChapter(chapterNumber + 1)}
            >
              <ChevronRight size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>

          {chapter.isPremium && chapter.isLocked ? (
            <div
              className={cn(
                "flex flex-col items-center gap-6 p-8 sm:p-12 text-center rounded-[2.5rem] border shadow-2xl",
                currentTheme.bar,
                currentTheme.border,
              )}
            >
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-amber-500/20">
                <Lock size={48} className="text-amber-500" />
              </div>
              <h2 className={cn("text-2xl font-black", currentTheme.text)}>
                Mở khóa nội dung Premium
              </h2>
              <p className="text-lg opacity-80">
                Chương này cần{" "}
                <span className="font-bold text-amber-500">
                  {chapter.price?.toLocaleString("vi") || 0} xu
                </span>{" "}
                để tiếp tục đọc.
              </p>
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
              <Link
                href="/wallet"
                className={cn(
                  "text-sm font-bold underline underline-offset-4 decoration-2",
                  currentTheme.accent,
                )}
              >
                Nạp thêm xu vào ví →
              </Link>
            </div>
          ) : (
            <div
              className={cn(
                "font-serif leading-[1.8] sm:leading-[2.2] wrap-break-word space-y-6 sm:space-y-8 select-text",
                "content-renderer [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:mx-auto",
                chapter.story?.type === "MANGA" ||
                  chapter.story?.type === "COMIC"
                  ? "flex flex-col items-center gap-1 sm:gap-2"
                  : "",
              )}
              dangerouslySetInnerHTML={{ __html: chapter.content || "" }}
            />
          )}
        </motion.article>
      </AnimatePresence>

      <footer className="max-w-[800px] mx-auto w-full px-4 sm:px-8 pb-32">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <button
            className={cn(
              "w-full sm:flex-1 h-12 sm:h-14 flex items-center justify-center gap-2 rounded-2xl border font-bold transition-all active:scale-95 disabled:opacity-30",
              currentTheme.btn,
            )}
            disabled={chapterNumber <= 1}
            onClick={() => navigateChapter(chapterNumber - 1)}
          >
            <ChevronLeft size={20} />
            <span className="text-sm sm:text-base">Chương trước</span>
          </button>

          <div className="w-full sm:w-[340px]">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger
                className={cn(
                  "w-full h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-between gap-3 group transition-all",
                  currentTheme.bar,
                  currentTheme.border,
                  "hover:border-emerald-500/50",
                )}
              >
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <List
                    size={20}
                    className="text-emerald-500 shrink-0 group-hover:rotate-12 transition-transform"
                  />
                  <span className="truncate opacity-90 text-sm sm:text-base">
                    {chapter
                      ? `Chương ${chapter.chapterNumber}: ${chapter.title}`
                      : "Chọn chương..."}
                  </span>
                </div>
                <ChevronRight
                  size={18}
                  className="opacity-40 group-hover:translate-x-1 transition-transform shrink-0"
                />
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className={cn(
                  "max-w-[95vw] sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl",
                  currentTheme.bar,
                  currentTheme.text,
                )}
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>Danh sách chương</DialogTitle>
                </DialogHeader>

                <div
                  className={cn(
                    "p-4 sm:p-5 pb-4 border-b",
                    currentTheme.border,
                  )}
                >
                  <div className="relative group">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 transition-transform group-focus-within:scale-110"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Tìm số chương hoặc tên..."
                      className={cn(
                        "w-full h-11 pl-12 pr-4 rounded-xl border bg-transparent outline-none focus:ring-2 ring-emerald-500/25 font-semibold transition-all text-sm sm:text-base",
                        currentTheme.border,
                        currentTheme.text,
                      )}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 no-scrollbar space-y-1">
                  {filteredChapters.length > 0 ? (
                    filteredChapters.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => handleSelectChapter(ch.chapterNumber)}
                        className={cn(
                          "w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl flex items-center justify-between group transition-all text-left",
                          ch.chapterNumber === chapterNumber
                            ? "bg-emerald-500/15 text-emerald-500"
                            : cn(
                                "hover:bg-black/5 dark:hover:bg-white/5",
                                currentTheme.text,
                              ),
                        )}
                      >
                        <div className="flex items-center gap-4 sm:gap-5 overflow-hidden">
                          <span
                            className={cn(
                              "font-bold shrink-0 min-w-[30px] sm:min-w-[35px] text-lg sm:text-xl",
                              ch.chapterNumber === chapterNumber
                                ? "text-emerald-500"
                                : "opacity-30",
                            )}
                          >
                            {ch.chapterNumber}
                          </span>
                          <span className="truncate font-semibold tracking-tight opacity-95 text-sm sm:text-base">
                            {ch.title}
                          </span>
                        </div>
                        {ch.chapterNumber === chapterNumber && (
                          <Check
                            size={18}
                            strokeWidth={3}
                            className="text-emerald-500 animate-in fade-in zoom-in duration-300"
                          />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-lg font-bold opacity-20">
                        Ốp la! Không tìm thấy chương...
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <button
            className={cn(
              "w-full sm:flex-1 h-12 sm:h-14 flex items-center justify-center gap-2 rounded-2xl border font-bold transition-all active:scale-95 disabled:opacity-30",
              currentTheme.btn,
            )}
            disabled={chapterNumber >= totalChapters}
            onClick={() => navigateChapter(chapterNumber + 1)}
          >
            <span className="text-sm sm:text-base">Chương sau</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
