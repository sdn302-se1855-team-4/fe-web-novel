"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  Clock,
  Star,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";

interface Story {
  id: string;
  title: string;
  coverImage?: string;
  description?: string;
  type?: string;
  status?: string;
  viewCount?: number;
  rating?: number;
  author?: {
    id: string;
    name?: string;
    displayName?: string;
    username?: string;
  };
  genres?: { id: string; name: string }[];
  _count?: { chapters: number };
}

interface HistoryItem {
  id: string;
  readAt: string;
  progress: number;
  story: Story;
  chapter: { id: string; title: string; chapterNumber: number };
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [latestStories, setLatestStories] = useState<Story[]>([]);
  const [topViewedStories, setTopViewedStories] = useState<Story[]>([]);
  const [completedStories, setCompletedStories] = useState<Story[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankTab, setRankTab] = useState<"views" | "rating" | "bookmarks">(
    "views",
  );

  // Carousel
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const logged = isLoggedIn();
    setLoggedIn(logged);

    const fetches: Promise<void>[] = [
      apiFetch<{ data: Story[] } | Story[]>("/stories?limit=8&sort=latest")
        .then((res) => {
          setLatestStories(
            Array.isArray(res) ? res : (res as { data: Story[] }).data || [],
          );
        })
        .catch(() => {}),

      apiFetch<{ data: Story[] } | Story[]>(
        "/stories?limit=10&sortBy=viewCount&sortOrder=desc",
      )
        .then((res) => {
          setTopViewedStories(
            Array.isArray(res) ? res : (res as { data: Story[] }).data || [],
          );
        })
        .catch(() => {}),

      apiFetch<{ data: Story[] } | Story[]>("/stories?limit=8&status=COMPLETED")
        .then((res) => {
          setCompletedStories(
            Array.isArray(res) ? res : (res as { data: Story[] }).data || [],
          );
        })
        .catch(() => {}),
    ];

    if (logged) {
      fetches.push(
        apiFetch<HistoryItem[]>("/reading-history/me?limit=5")
          .then((res) => setHistory(Array.isArray(res) ? res : []))
          .catch(() => {}),
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, []);

  // Auto-advance carousel
  const featuredStories = latestStories.slice(0, 5);

  const nextSlide = useCallback(() => {
    setCarouselIdx((prev) => (prev + 1) % Math.max(featuredStories.length, 1));
  }, [featuredStories.length]);

  const prevSlide = () => {
    setCarouselIdx(
      (prev) =>
        (prev - 1 + featuredStories.length) %
        Math.max(featuredStories.length, 1),
    );
  };

  useEffect(() => {
    if (featuredStories.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [featuredStories.length, nextSlide]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_COVER) {
      target.src = DEFAULT_COVER;
    }
  };

  const getRankedStories = () => {
    const copy = [...topViewedStories];
    if (rankTab === "rating") {
      copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return copy.slice(0, 10);
  };

  const currentFeatured = featuredStories[carouselIdx];

  return (
    <div className={styles.page}>
      {/* ── Featured Carousel ── */}
      {!loading && featuredStories.length > 0 && (
        <section className={styles.carousel}>
          <div className={styles.carouselInner}>
            {/* Background image */}
            <div
              className={styles.carouselBg}
              style={{
                backgroundImage: `url(${currentFeatured?.coverImage || DEFAULT_COVER})`,
              }}
            />
            <div className={styles.carouselOverlay} />

            <div className={styles.carouselContent}>
              <div className={styles.carouselInfo}>
                {currentFeatured?.type && (
                  <span className={styles.carouselBadge}>
                    {currentFeatured.type}
                  </span>
                )}
                <h2 className={styles.carouselTitle}>
                  {currentFeatured?.title}
                </h2>
                <p className={styles.carouselDesc}>
                  {currentFeatured?.description
                    ? currentFeatured.description.slice(0, 120) +
                      (currentFeatured.description.length > 120 ? "..." : "")
                    : "Khám phá câu chuyện hấp dẫn tại BestNovelVN"}
                </p>
                <div className={styles.carouselMeta}>
                  {currentFeatured?.author?.id ? (
                    <Link
                      href={`/users/${currentFeatured.author.id}`}
                      className={styles.carouselAuthor}
                    >
                      {currentFeatured?.author?.displayName ||
                        currentFeatured?.author?.username ||
                        currentFeatured?.author?.name ||
                        "Tác giả"}
                    </Link>
                  ) : (
                    <span>
                      {currentFeatured?.author?.displayName ||
                        currentFeatured?.author?.username ||
                        currentFeatured?.author?.name ||
                        "Tác giả"}
                    </span>
                  )}
                  {currentFeatured?._count?.chapters !== undefined && (
                    <span>{currentFeatured._count.chapters} chương</span>
                  )}
                </div>
                <Link
                  href={`/stories/${currentFeatured?.id}`}
                  className={styles.carouselBtn}
                >
                  Đọc ngay <ChevronRight size={16} />
                </Link>
              </div>

              {/* Cover image thumbnail */}
              <Link
                href={`/stories/${currentFeatured?.id}`}
                className={styles.carouselCoverWrap}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentFeatured?.coverImage || DEFAULT_COVER}
                  alt={currentFeatured?.title || ""}
                  className={styles.carouselCover}
                  onError={handleImageError}
                />
              </Link>
            </div>

            {/* Nav arrows */}
            {featuredStories.length > 1 && (
              <>
                <button
                  className={`${styles.carouselArrow} ${styles.carouselPrev}`}
                  onClick={prevSlide}
                  aria-label="Trước"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className={`${styles.carouselArrow} ${styles.carouselNext}`}
                  onClick={nextSlide}
                  aria-label="Sau"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Dots */}
            {featuredStories.length > 1 && (
              <div className={styles.carouselDots}>
                {featuredStories.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.carouselDot} ${i === carouselIdx ? styles.carouselDotActive : ""}`}
                    onClick={() => setCarouselIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Continue Reading ── */}
      {loggedIn && history.length > 0 && (
        <section className={`container ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Clock size={20} /> Tiếp tục đọc
            </h2>
            <Link href="/history" className={styles.viewAll}>
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>
          <div className={styles.historyRow}>
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}`}
                className={styles.historyCard}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.story.coverImage || DEFAULT_COVER}
                  alt={item.story.title}
                  className={styles.historyCover}
                  onError={handleImageError}
                />
                <div className={styles.historyInfo}>
                  <span className={styles.historyTitle}>
                    {item.story.title}
                  </span>
                  <span className={styles.historyChapter}>
                    Chương {item.chapter.chapterNumber}: {item.chapter.title}
                  </span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Stories ── */}
      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={20} /> Truyện mới cập nhật
          </h2>
          <Link href="/stories" className={styles.viewAll}>
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid-stories">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonCover}`} />
                <div className={styles.skeletonInfo}>
                  <div
                    className="skeleton"
                    style={{ height: 14, width: "80%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 12, width: "50%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : latestStories.length > 0 ? (
          <div className="grid-stories">
            {latestStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <BookOpen size={48} />
            <p>Chưa có truyện nào. Hãy quay lại sau!</p>
          </div>
        )}
      </section>

      {/* ── Rankings ── */}
      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={20} /> Xếp hạng
          </h2>
        </div>
        <div className={styles.rankTabs}>
          <button
            className={`${styles.rankTab} ${rankTab === "views" ? styles.rankTabActive : ""}`}
            onClick={() => setRankTab("views")}
          >
            <TrendingUp size={14} /> Xem nhiều
          </button>
          <button
            className={`${styles.rankTab} ${rankTab === "rating" ? styles.rankTabActive : ""}`}
            onClick={() => setRankTab("rating")}
          >
            <Star size={14} /> Đánh giá cao
          </button>
          <button
            className={`${styles.rankTab} ${rankTab === "bookmarks" ? styles.rankTabActive : ""}`}
            onClick={() => setRankTab("bookmarks")}
          >
            <Bookmark size={14} /> Yêu thích
          </button>
        </div>
        <div className={styles.rankList}>
          {getRankedStories().map((story, idx) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className={styles.rankItem}
            >
              <span
                className={`${styles.rankNumber} ${idx < 3 ? styles.rankTop : ""}`}
              >
                {idx + 1}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.coverImage || DEFAULT_COVER}
                alt={story.title}
                className={styles.rankCover}
                onError={handleImageError}
              />
              <div className={styles.rankInfo}>
                <span className={styles.rankTitle}>{story.title}</span>
                <span className={styles.rankMeta}>
                  {story.author?.id ? (
                    <Link
                      href={`/users/${story.author.id}`}
                      className={styles.rankAuthor}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {story.author?.displayName ||
                        story.author?.username ||
                        story.author?.name ||
                        "Tác giả"}
                    </Link>
                  ) : (
                    <span>
                      {story.author?.displayName ||
                        story.author?.username ||
                        story.author?.name ||
                        "Tác giả"}
                    </span>
                  )}
                  {story.genres && story.genres.length > 0 && (
                    <> · {story.genres[0].name}</>
                  )}
                </span>
              </div>
              <span className={styles.rankStat}>
                {rankTab === "views"
                  ? `${Intl.NumberFormat("vi", { notation: "compact" }).format(story.viewCount || 0)} lượt xem`
                  : rankTab === "rating"
                    ? `${(story.rating || 0).toFixed(1)} ★`
                    : `${Intl.NumberFormat("vi", { notation: "compact" }).format(story.viewCount || 0)} lượt xem`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Completed Stories ── */}
      {completedStories.length > 0 && (
        <section className={`container ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <CheckCircle size={20} /> Truyện đã hoàn thành
            </h2>
            <Link href="/stories?status=COMPLETED" className={styles.viewAll}>
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid-stories">
            {completedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
