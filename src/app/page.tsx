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
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] overflow-x-hidden">
      {/* ── HERO CAROUSEL ── */}
      {loading ? (
        <section className="relative w-full h-screen overflow-hidden">
          <Skeleton className="absolute inset-0 bg-[#020617]" />
        </section>
      ) : featuredStories.length > 0 ? (
        <section className="relative w-full h-screen overflow-hidden">
          <Carousel
            opts={{ loop: true } as any}
            className="w-full h-screen"
            setApi={(api) => {
              setApi(api);
              api?.on("select", () => {
                setCarouselIdx(api.selectedScrollSnap());
              });
            }}
          >
            <CarouselContent className="h-full ml-0" wrapperClassName="h-full">
              {featuredStories.map((story, i) => (
                <CarouselItem key={story.id} className="h-full pl-0">
                  <div className="relative w-full h-full flex flex-col justify-center">
                    {/* Background */}
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={story.coverImage || DEFAULT_COVER}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={handleImageError}
                      />
                      {/* Immersive Gradients */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/60 to-transparent z-10" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
                      <div className="absolute inset-0 bg-black/20 z-0" />
                    </div>

                    <div className="relative z-20 h-full w-full max-w-7xl mx-auto px-8 md:px-12 flex flex-col justify-center">
                      <div className="max-w-2xl">
                        {story.genres && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {story.genres.slice(0, 3).map((g) => (
                              <Badge
                                key={g.id}
                                variant="secondary"
                                className="bg-white/10 hover:bg-white/20 text-white border-none px-3 py-1 font-medium"
                              >
                                {g.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <h1
                          className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white tracking-tighter drop-shadow-2xl"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {story.title}
                        </h1>
                        <p className="text-[#e2e8f0] text-lg leading-relaxed mb-8 line-clamp-3 max-w-xl drop-shadow-md">
                          {story.description
                            ? story.description.slice(0, 200) + "..."
                            : "Khám phá câu chuyện hấp dẫn tại BestNovelVN"}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-[#cbd5e1] mb-10">
                          <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <BookOpen size={14} className="text-[#10b981]" />{" "}
                            {story._count?.chapters} chương
                          </span>
                          <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <Star
                              size={14}
                              fill="currentColor"
                              className="text-[#f59e0b]"
                            />{" "}
                            {story.rating?.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Link href={`/stories/${story.id}`}>
                            <Button
                              size="lg"
                              className="rounded-full px-10 py-7 text-lg font-bold bg-[#10b981] hover:bg-[#34d399] text-[#020617] cursor-pointer shadow-2xl shadow-[#10b981]/40 scale-100 hover:scale-105 transition-transform"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                                  <ArrowRight size={20} />
                                </div>
                                Bắt đầu đọc
                              </div>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute bottom-12 right-12 z-40 flex flex-col items-end gap-8">
              {featuredStories.length > 1 && (
                <div className="flex items-center gap-3">
                  {featuredStories.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => api?.scrollTo(i)}
                      className={`relative flex-shrink-0 transition-all duration-500 overflow-hidden rounded-xl border-2 cursor-pointer ${
                        i === carouselIdx
                          ? "w-32 h-18 border-[#10b981] scale-100 shadow-2xl"
                          : "w-28 h-16 border-white/10 opacity-60 hover:opacity-100 scale-95"
                      }`}
                    >
                      <img
                        src={s.coverImage || DEFAULT_COVER}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                      {i !== carouselIdx && (
                        <div className="absolute inset-0 bg-black/40" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pr-4">
                {featuredStories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${i === carouselIdx ? "w-10 h-1.5 bg-[#10b981]" : "w-2 h-1.5 bg-white/30"}`}
                  />
                ))}
              </div>
            </div>
            <CarouselPrevious className="left-6 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-[#10b981] border-none text-white w-12 h-20 rounded-xl rounded-l-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="right-6 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-[#10b981] border-none text-white w-12 h-20 rounded-xl rounded-r-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </Carousel>
        </section>
      ) : null}

      {/* ── CONTINUE READING ── */}
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
                           bg-[#0f172a] border border-white/5 p-4 rounded-2xl
                           hover:border-[#10b981]/30 hover:bg-[#0f172a]/80
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
                  <p className="text-sm font-medium text-[#f8fafc] truncate">
                    {item.story.title}
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5 truncate">
                    <Clock size={11} className="inline mr-1" />
                    Chương {item.chapter.chapterNumber}
                  </p>
                  <div className="mt-2 w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
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
          title="Chương mới cập nhật"
          href="/stories"
          linkLabel="Khám phá thêm"
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : latestStories.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={stagger}
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

      {/* ── RANKINGS + COMPLETED (2-col) ── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10">
          {/* — Rankings — */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <SectionHeader title="Bảng xếp hạng" />

            {/* Tab row */}
            <Tabs
              defaultValue="views"
              value={rankTab}
              onValueChange={(val) => setRankTab(val as any)}
            >
              <TabsList className="w-full mb-6 bg-[#0f172a] p-1.5 rounded-xl border border-white/5">
                {RANK_TABS.map(({ key, label, icon: Icon }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={cn(
                      "flex-1 text-[10px] font-black py-2.5 px-2 flex items-center justify-center gap-2 uppercase tracking-wider transition-all duration-500 cursor-pointer rounded-lg hover:bg-white/5 active:scale-95",
                      rankTab === key
                        ? "bg-[#10b981] text-[#020617] shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[1.02]"
                        : "text-slate-400",
                    )}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent key={rankTab} value={rankTab} className="mt-0">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-px"
                  >
                    {getRankedStories().map((story, idx) => (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="flex items-center gap-4 p-3 rounded-2xl
                                   hover:bg-white/5 transition-all duration-300 
                                   group cursor-pointer"
                      >
                        <span
                          className={`text-base font-bold w-7 text-center flex-shrink-0
                            ${idx === 0 ? "text-[#f59e0b]" : idx === 1 ? "text-[#94a3b8]" : idx === 2 ? "text-[#a16207]" : "text-[#334155]"}`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={story.coverImage || DEFAULT_COVER}
                          alt={story.title}
                          className="w-10 h-14 object-cover flex-shrink-0 rounded-md"
                          onError={handleImageError}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#f8fafc] truncate group-hover:text-[#10b981] transition-colors">
                            {story.title}
                          </p>
                          <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
                            {rankTab === "rating" ? (
                              <>
                                <Star
                                  size={11}
                                  fill="currentColor"
                                  className="text-[#f59e0b]"
                                />{" "}
                                {(story.rating || 0).toFixed(1)}
                              </>
                            ) : (
                              <>
                                <Eye size={11} />{" "}
                                {Intl.NumberFormat("vi", {
                                  notation: "compact",
                                }).format(story.viewCount || 0)}{" "}
                                lượt
                              </>
                            )}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>

          {/* — Completed novels — */}
          {completedStories.length > 0 && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
            >
              <SectionHeader
                title="Tiểu thuyết trọn bộ"
                href="/stories?status=COMPLETED"
                linkLabel="Xem tất cả"
              />
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                variants={stagger}
              >
                {completedStories.map((story) => (
                  <motion.div key={story.id} variants={cardVariant}>
                    <StoryCard story={story} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>
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
        <div className="w-1.5 h-8 bg-[#10b981] rounded-full shadow-lg shadow-[#10b981]/20" />
        <h2
          className="text-lg font-bold text-white tracking-tight"
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
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#334155]">
      <BookOpen size={48} strokeWidth={1} />
      <p className="text-sm">Chưa có câu chuyện nào được cập nhật.</p>
    </div>
  );
}
