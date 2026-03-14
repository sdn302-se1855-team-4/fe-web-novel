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
      <div className={styles.page} data-reader-theme="light">
        <div className={styles.content}>
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
    <div className={styles.page} data-reader-theme={readerTheme}>
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={styles.topBar}
      >
        <Link href={`/stories/${storyId}`} className={styles.backLink}>
          <ChevronLeft size={18} />
          <span className={styles.storyTitle}>
            {chapter.story?.title || "Trở lại"}
          </span>
        </Link>
        <div className={styles.controls}>
          <button className="btn-icon" onClick={() => changeFontSize(-2)} aria-label="Giảm chữ">
            <Minus size={16} />
          </button>
          <span className={styles.fontSizeLabel}>{fontSize}PX</span>
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
          className={styles.content} 
          style={{ fontSize: `${fontSize}px` }}
        >
          <h1 className={styles.chapterHeading}>
            Chương {chapter.chapterNumber}: {chapter.title}
            {chapter.isPremium && (
              <span className={styles.premiumBadge}>
                <Coins size={14} /> PREMIUM
              </span>
            )}
          </h1>

          {/* Inline Navigation Bar */}
          <div className={styles.inlineNav}>
            <button 
              className={styles.navIconBtn} 
              disabled={chapterNumber <= 1}
              onClick={() => navigateChapter(chapterNumber - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            
            <select 
              className={styles.chapterSelect}
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
              className={styles.navIconBtn} 
              disabled={chapterNumber >= totalChapters}
              onClick={() => navigateChapter(chapterNumber + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {chapter.isPremium && chapter.isLocked ? (
            <div className={styles.paywall}>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 border-2 border-amber-200">
                <Lock size={40} className="text-amber-600" />
              </div>
              <h2>Mở khóa nội dung Premium</h2>
              <p>Chương này cần <strong>{chapter.price?.toLocaleString("vi") || 0} xu</strong> để tiếp tục đọc.</p>
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
              <Link href="/wallet" className={styles.paywallLink}>
                Nạp thêm xu vào ví →
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
        </motion.article>
      </AnimatePresence>

      {/* Navigation */}
      <nav className={styles.chapterNav}>
        <div className={styles.inlineNav} style={{ margin: 0 }}>
          <button 
            className={styles.navIconBtn} 
            disabled={chapterNumber <= 1}
            onClick={() => navigateChapter(chapterNumber - 1)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <select 
            className={styles.chapterSelect}
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
            className={styles.navIconBtn} 
            disabled={chapterNumber >= totalChapters}
            onClick={() => navigateChapter(chapterNumber + 1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </nav>
    </div>
  );
}
