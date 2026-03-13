"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  BookOpen,
  Star,
  ChevronRight,
  ChevronLeft,
  Eye,
  Flame,
  Award,
  Heart,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/StoryCard";
import { type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

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

const RANK_TABS = [
  { key: "views", label: "Thịnh hành", icon: Flame },
  { key: "rating", label: "Đánh giá cao", icon: Award },
  { key: "bookmarks", label: "Yêu thích nhất", icon: Heart },
] as const;

// Animation variants - properly typed for Framer Motion
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [latestStories, setLatestStories] = useState<Story[]>([]);
  const [topViewedStories, setTopViewedStories] = useState<Story[]>([]);
  const [topRatedStories, setTopRatedStories] = useState<Story[]>([]);
  const [exclusiveStories, setExclusiveStories] = useState<Story[]>([]);
  const [completedStories, setCompletedStories] = useState<Story[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [loading, setLoading] = useState(true);
  const [rankTab, setRankTab] = useState<"views" | "rating" | "bookmarks">(
    "views",
  );
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const logged = isLoggedIn();
    Promise.resolve().then(() => setLoggedIn(logged));

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
      apiFetch<{ data: Story[] } | Story[]>(
        "/stories?limit=6&sortBy=rating&sortOrder=desc",
      )
        .then((res) => {
          const data = Array.isArray(res) ? res : (res as { data: Story[] }).data || [];
          setTopRatedStories(data);
          if (data.length === 0 && latestStories.length > 0) {
             // Fallback to latest but skip first 5 (hero)
             setTopRatedStories(latestStories.slice(5, 11));
          }
        })
        .catch(() => {}),
      apiFetch<{ data: Story[] } | Story[]>("/stories?limit=6&sort=trending")
        .then((res) => {
          const data = Array.isArray(res) ? res : (res as { data: Story[] }).data || [];
          setExclusiveStories(data);
          // If exclusive is empty, fallback to some trending data
          if (data.length === 0) {
             setExclusiveStories(topViewedStories.slice(0, 6));
          }
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

  const featuredStories = latestStories.slice(0, 5);

  const nextSlide = useCallback(() => {
    if (api) {
      api.scrollNext();
    } else {
      setCarouselIdx(
        (prev) => (prev + 1) % Math.max(featuredStories.length, 1),
      );
    }
  }, [api, featuredStories.length]);

  const prevSlide = () => {
    setCarouselIdx(
      (prev) =>
        (prev - 1 + featuredStories.length) %
        Math.max(featuredStories.length, 1),
    );
  };

  useEffect(() => {
    if (featuredStories.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [featuredStories.length, nextSlide]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_COVER) target.src = DEFAULT_COVER;
  };

  const getRankedStories = () => {
    const copy = [...topViewedStories];
    if (rankTab === "rating")
      copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return copy.slice(0, 10);
  };

  const currentFeatured = featuredStories[carouselIdx];

  return (
    <div className="min-h-screen bg-bg-brand text-text-primary overflow-x-hidden pb-20">
      {/* ── HERO CAROUSEL ── */}
      <section className="relative px-6 pt-6 pb-10 max-w-7xl mx-auto">
        {loading ? (
          <Skeleton className="h-[450px] w-full rounded-3xl bg-surface-elevated" />
        ) : latestStories.length > 0 ? (
          <div className="relative group">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {latestStories.slice(0, 5).map((story, index) => (
                  <CarouselItem key={story.id}>
                    <Link href={`/stories/${story.id}`}>
                      <div className="relative h-[450px] w-full overflow-hidden rounded-3xl cursor-pointer">
                        {/* Background Image with blur effect */}
                        <img
                          src={story.coverImage || DEFAULT_COVER}
                          alt={story.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={handleImageError}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-2xl">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                          >
                            <div className="flex gap-2">
                              {story.genres?.slice(0, 2).map(g => (
                                <Badge key={g.id} className="bg-emerald-500 text-white border-0">
                                  {g.name}
                                </Badge>
                              ))}
                              {story.status === "COMPLETED" && (
                                <Badge className="bg-blue-600 text-white border-0">Full</Badge>
                              )}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                              {story.title}
                            </h2>
                            <p className="text-sm md:text-base text-gray-200 line-clamp-2 max-w-lg font-medium">
                              {story.description || "Khám phá thế giới tiểu thuyết đầy hấp dẫn..."}
                            </p>
                            <div className="flex items-center gap-6 pt-2">
                              <Button className="bg-[#10b981] hover:bg-[#10b981]/90 text-white px-8 py-6 rounded-2xl font-bold flex gap-2 text-base">
                                <BookOpen size={20} /> Đọc ngay
                              </Button>
                              <div className="flex items-center gap-4 text-white/80">
                                <span className="flex items-center gap-1.5 font-bold">
                                  <Eye size={18} className="text-emerald-400" />
                                  {Intl.NumberFormat("vi", { notation: "compact" }).format(story.viewCount || 0)}
                                </span>
                                <span className="flex items-center gap-1.5 font-bold">
                                  <Star size={18} className="text-yellow-400" fill="currentColor" />
                                  {(story.rating || 0).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <CarouselPrevious className="relative left-0 bg-white/10 hover:bg-white/20 border-white/20 text-white" />
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <CarouselNext className="relative right-0 bg-white/10 hover:bg-white/20 border-white/20 text-white" />
              </div>
            </Carousel>

            {/* Pagination custom indicators */}
            <div className="absolute bottom-6 right-12 flex gap-2">
              {latestStories.slice(0, 5).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    carouselIdx === i ? "w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
      {loggedIn && history.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-6 py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Tiếp tục hành trình"
            href="/history"
            linkLabel="Tủ sách của tôi"
          />
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {history.map((item) => (
              <Link
                key={item.id}
              href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}`}
              className="flex-shrink-0 flex gap-4 items-center w-[300px] 
                         bg-surface-brand border border-border-brand p-4 rounded-2xl
                         hover:border-[#10b981]/30 hover:bg-surface-elevated
                         transition-all duration-300 cursor-pointer group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.story.coverImage || DEFAULT_COVER}
                  alt={item.story.title}
                  className="w-14 h-20 object-cover flex-shrink-0 rounded-lg group-hover:scale-105 transition-transform"
                  onError={handleImageError}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {item.story.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    <Clock size={11} className="inline mr-1" />
                    Chương {item.chapter.chapterNumber}
                  </p>
                  <div className="mt-2 w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10b981] rounded-full"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── LATEST STORIES ── */}
      <motion.section
        className="max-w-7xl mx-auto px-6 py-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp}
      >
        <SectionHeader
          title="Truyện mới cập nhật"
          href="/stories"
          linkLabel="Khám phá thêm"
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-2xl bg-surface-elevated" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-3/4 bg-surface-elevated" />
                  <Skeleton className="h-3 w-1/2 bg-surface-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : latestStories.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {latestStories.map((story) => (
              <motion.div key={story.id} variants={cardVariant}>
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState />
        )}
      </motion.section>

      {/* ── TOP VIEWED STORIES (XEM NHIỀU NHẤT) ── */}
      {topViewedStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-6 py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Được xem nhiều nhất"
            href="/rankings?tab=week"
            linkLabel="Bảng xếp hạng"
          />
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {topViewedStories.slice(0, 6).map((story) => (
              <motion.div key={story.id} variants={cardVariant}>
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ── TOP RATED STORIES (TRUYỆN HAY) ── */}
      {topRatedStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-6 py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Truyện Hay"
            href="/rankings?tab=favorites"
            linkLabel="Xem tất cả"
          />
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {topRatedStories.map((story) => (
              <motion.div key={story.id} variants={cardVariant}>
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ── EXCLUSIVE STORIES (TRUYỆN ĐỘC QUYỀN) ── */}
      {exclusiveStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-6 py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Truyện Độc Quyền"
            href="/rankings?tab=week"
            linkLabel="Khám phá ngay"
          />
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {exclusiveStories.map((story) => (
              <motion.div key={story.id} variants={cardVariant}>
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ── COMPLETED NOVELS ── */}
      {completedStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-6 py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Tiểu thuyết trọn bộ"
            href="/rankings?tab=full"
            linkLabel="Xem tất cả"
          />
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {completedStories.map((story) => (
              <motion.div key={story.id} variants={cardVariant}>
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-primary-brand rounded-full shadow-lg shadow-primary-glow" />
        <h2
          className="text-xl font-black text-text-primary tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-[#64748b] uppercase tracking-widest
                     hover:text-[#10b981] transition-colors duration-200 cursor-pointer"
        >
          {linkLabel} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
      <BookOpen size={48} strokeWidth={1} />
      <p className="text-sm">Chưa có câu chuyện nào được cập nhật.</p>
    </div>
  );
}
