"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  BookOpen,
  Star,
  ChevronRight,
  ChevronLeft,
  Eye,
  Clock,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { isLoggedIn, getUserRole } from "@/lib/auth";
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
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [latestStories, setLatestStories] = useState<Story[]>([]);
  const [topViewedStories, setTopViewedStories] = useState<Story[]>([]);
  const [topRatedStories, setTopRatedStories] = useState<Story[]>([]);
  const [exclusiveStories, setExclusiveStories] = useState<Story[]>([]);
  const [completedStories, setCompletedStories] = useState<Story[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const logged = isLoggedIn();
    const role = getUserRole();
    Promise.resolve().then(() => setLoggedIn(logged));

    if (logged && role === "ADMIN") {
      router.push("/admin");
      return;
    }

    const fetchHomeData = async () => {
      try {
        const [latestRes, topViewedRes, completedRes, topRatedRes, exclusiveRes] = await Promise.all([
          apiFetch<{ data: Story[] } | Story[]>("/stories?limit=8&sort=latest"),
          apiFetch<{ data: Story[] } | Story[]>("/stories?limit=10&sortBy=viewCount&sortOrder=desc"),
          apiFetch<{ data: Story[] } | Story[]>("/stories?limit=8&status=COMPLETED"),
          apiFetch<{ data: Story[] } | Story[]>("/stories?limit=6&sortBy=rating&sortOrder=desc"),
          apiFetch<{ data: Story[] } | Story[]>("/stories?limit=6&sort=trending")
        ]);

        const latest = Array.isArray(latestRes) ? latestRes : latestRes.data || [];
        const topViewed = Array.isArray(topViewedRes) ? topViewedRes : topViewedRes.data || [];
        const completed = Array.isArray(completedRes) ? completedRes : completedRes.data || [];
        let topRated = Array.isArray(topRatedRes) ? topRatedRes : topRatedRes.data || [];
        let exclusive = Array.isArray(exclusiveRes) ? exclusiveRes : exclusiveRes.data || [];

        setLatestStories(latest);
        setTopViewedStories(topViewed);
        setCompletedStories(completed);

        if (topRated.length === 0 && latest.length > 0) {
          topRated = latest.slice(5, 11);
        }
        setTopRatedStories(topRated);

        if (exclusive.length === 0) {
          exclusive = topViewed.slice(0, 6);
        }
        setExclusiveStories(exclusive);

        if (logged) {
          const historyRes = await apiFetch<HistoryItem[]>("/reading-history/me?limit=5");
          setHistory(Array.isArray(historyRes) ? historyRes : []);
        }
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [router]);

  const featuredStories = latestStories.slice(0, 5);

  // Sync dot indicators with the actual carousel position
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCarouselIdx(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const nextSlide = useCallback(() => {
    if (!api) return;
    if (api.canScrollNext()) {
      api.scrollNext();
    } else {
      // Wrap around to the first slide
      api.scrollTo(0);
    }
  }, [api]);

  const prevSlide = useCallback(() => {
    if (!api) return;
    if (api.canScrollPrev()) {
      api.scrollPrev();
    } else {
      // Wrap around to the last slide
      api.scrollTo(featuredStories.length - 1);
    }
  }, [api, featuredStories.length]);

  useEffect(() => {
    if (featuredStories.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [featuredStories.length, nextSlide]);


  // Sections removed: getRankedStories (unused), currentFeatured (unused)

  return (
    <div className="min-h-screen bg-bg-brand text-text-primary overflow-x-hidden pb-20">
      {/* ── HERO CAROUSEL ── */}
      <section className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-10 max-w-7xl mx-auto">
        {loading ? (
          <Skeleton className="h-[320px] sm:h-[400px] lg:h-[480px] w-full rounded-2xl sm:rounded-3xl bg-surface-elevated" />
        ) : latestStories.length > 0 ? (
          <div className="relative group">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {latestStories.slice(0, 5).map((story) => (
                  <CarouselItem key={story.id}>
                    <Link href={`/stories/${story.id}`}>
                      <div className="relative h-[320px] sm:h-[400px] lg:h-[480px] w-full overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer">
                        {/* Background Image with blur effect */}
                        <Image
                          src={story.coverImage || DEFAULT_COVER}
                          alt={story.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          unoptimized
                        />
                        {/* Overlay Gradient - Darker on mobile for better text contrast */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent sm:from-black/80 sm:via-black/20" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-5 sm:p-8 md:p-12 w-full max-w-3xl">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-3 sm:space-y-4"
                          >
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {story.genres?.slice(0, 2).map((g) => (
                                <Badge
                                  key={g.id}
                                  className="bg-emerald-500 text-[10px] sm:text-xs text-white border-0 py-0 sm:py-0.5"
                                >
                                  {g.name}
                                </Badge>
                              ))}
                              {story.status === "COMPLETED" && (
                                <Badge className="bg-blue-600 text-[10px] sm:text-xs text-white border-0 py-0 sm:py-0.5">
                                  Full
                                </Badge>
                              )}
                            </div>
                            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg">
                              {story.title}
                            </h2>
                            <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 max-w-lg font-medium drop-shadow-md">
                              {story.description ||
                                "Khám phá thế giới tiểu thuyết đầy hấp dẫn..."}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1 sm:pt-2">
                              <Button className="bg-[#10b981] hover:bg-[#10b981]/90 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold flex gap-2 text-sm sm:text-base w-fit h-auto shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                <BookOpen size={18} className="sm:w-5 sm:h-5" />{" "}
                                Đọc ngay
                              </Button>
                              <div className="flex items-center gap-4 sm:gap-6 text-white/90">
                                <span className="flex items-center gap-1.5 text-sm sm:text-base font-bold bg-black/20 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-lg backdrop-blur-sm sm:backdrop-blur-none">
                                  <Eye
                                    size={16}
                                    className="text-emerald-400 sm:w-[18px] sm:h-[18px]"
                                  />
                                  {Intl.NumberFormat("vi", {
                                    notation: "compact",
                                  }).format(story.viewCount || 0)}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm sm:text-base font-bold bg-black/20 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-lg backdrop-blur-sm sm:backdrop-blur-none">
                                  <Star
                                    size={16}
                                    className="text-yellow-400 sm:w-[18px] sm:h-[18px]"
                                    fill="currentColor"
                                  />
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

              <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    prevSlide();
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    nextSlide();
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </Carousel>

            {/* Pagination custom indicators */}
            <div className="absolute bottom-4 sm:bottom-6 right-6 sm:right-12 flex gap-1.5 sm:gap-2">
              {latestStories.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 sm:h-1.5 rounded-full transition-all duration-300",
                    carouselIdx === i
                      ? "w-6 sm:w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "w-1 sm:w-1.5 bg-white/40",
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
      {loggedIn && history.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8"
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
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x px-1 sm:px-0">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/stories/${item.story.id}/chapters/${item.chapter.chapterNumber}`}
                className="shrink-0 flex gap-4 items-center w-[280px] sm:w-[320px] snap-start
                           bg-surface-brand border border-border-brand/60 p-4 rounded-2xl
                           hover:border-emerald-500/30 hover:bg-surface-elevated hover:shadow-lg
                           transition-all duration-300 cursor-pointer group"
              >
                <div className="relative w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={item.story.coverImage || DEFAULT_COVER}
                    alt={item.story.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
                  <p className="text-sm sm:text-base font-black text-text-primary truncate leading-tight group-hover:text-emerald-500 transition-colors">
                    {item.story.title}
                  </p>
                  <p className="text-[11px] sm:text-xs font-bold text-text-muted truncate flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-500" />
                    Chương {item.chapter.chapterNumber}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                      <span>Tiến độ</span>
                      <span>{Math.round(item.progress || 0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-500"
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── LATEST STORIES ── */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp}
      >
        <SectionHeader
          title="Mới Cập Nhật"
          subtitle="Những câu chuyện vừa lên kệ, đa dạng thể loại"
          href="/stories"
          linkLabel="Khám phá thêm"
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-3/4 w-full rounded-2xl bg-surface-elevated" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-3/4 bg-surface-elevated" />
                  <Skeleton className="h-3 w-1/2 bg-surface-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : latestStories.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-8"
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

      {/* ── TRENDING HIGHLIGHT (ĐƯỢC XEM NHIỀU NHẤT) ── */}
      {topViewedStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Sóng Cuộn Xu Hướng"
            subtitle="Những bộ truyện đang làm mưa làm gió tuần này"
            href="/rankings?tab=week"
            linkLabel="Bảng xếp hạng"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Main Highlight Card */}
            <div className="lg:col-span-8 group">
              <Link href={`/stories/${topViewedStories[0].id}`}>
                <div className="relative aspect-3/4 sm:aspect-video lg:aspect-auto lg:h-[550px] overflow-hidden rounded-4xl sm:rounded-[3rem] border border-border-brand/40 bg-surface-elevated shadow-2xl">
                  <Image
                    src={topViewedStories[0].coverImage || DEFAULT_COVER}
                    alt={topViewedStories[0].title}
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent sm:via-transparent" />

                  <div className="absolute bottom-0 left-0 p-6 sm:p-12 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                      <div className="bg-emerald-500 text-white font-black px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                        TOP #1 THỦY TRIỀU
                      </div>
                      <div className="bg-white/10 backdrop-blur-md text-white font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest border border-white/20">
                        {topViewedStories[0].genres?.[0]?.name}
                      </div>
                    </div>
                    <h3 className="text-2xl sm:text-5xl font-black text-white mb-2 sm:mb-6 group-hover:text-emerald-400 transition-colors drop-shadow-2xl leading-tight sm:leading-[1.1]">
                      {topViewedStories[0].title}
                    </h3>
                    <p className="text-white/70 text-xs sm:text-base line-clamp-2 md:line-clamp-3 max-w-2xl mb-6 sm:mb-10 leading-relaxed font-medium">
                      {topViewedStories[0].description}
                    </p>
                    <div className="flex items-center gap-4 sm:gap-10">
                      <div className="flex items-center gap-2.5 sm:gap-4 text-white">
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20">
                          <Eye className="text-emerald-400" size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] text-white/40 font-black uppercase tracking-tighter">
                            Lượt xem
                          </span>
                          <span className="font-black text-base sm:text-xl">
                            {Intl.NumberFormat("vi", {
                              notation: "compact",
                            }).format(topViewedStories[0].viewCount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-4 text-white">
                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/20">
                          <Star
                            className="text-yellow-400"
                            fill="currentColor"
                            size={18}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] text-white/40 font-black uppercase tracking-tighter">
                            Đánh giá
                          </span>
                          <span className="font-black text-base sm:text-xl">
                            {(topViewedStories[0].rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Sidebar mini list */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                {topViewedStories.slice(1, 4).map((story, idx) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="flex gap-4 p-4 rounded-3xl bg-surface-brand border border-border-brand/60 hover:border-emerald-500/40 hover:bg-surface-elevated hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="relative w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg ring-1 ring-border-brand/40">
                      <Image
                        src={story.coverImage || DEFAULT_COVER}
                        alt={story.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        unoptimized
                      />
                      <div className="absolute top-2 left-2 w-8 h-8 bg-black/70 backdrop-blur-md rounded-xl flex items-center justify-center text-white text-xs font-black ring-1 ring-white/10 shadow-xl">
                        #{idx + 2}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <h4 className="font-bold text-text-primary group-hover:text-emerald-500 transition-colors line-clamp-2 leading-tight text-base">
                        {story.title}
                      </h4>
                      {story.genres?.[0]?.name && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                            {story.genres?.[0]?.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5">
                          <Eye size={14} className="text-text-muted" />
                          <span className="text-xs font-black text-text-secondary">
                            {Intl.NumberFormat("vi", {
                              notation: "compact",
                            }).format(story.viewCount || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star
                            size={14}
                            className="text-amber-500"
                            fill="currentColor"
                          />
                          <span className="text-xs font-black text-text-secondary">
                            {(story.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href="/rankings"
                className="mt-auto group flex items-center justify-between w-full p-5 rounded-3xl bg-surface-elevated text-emerald-500 font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10 shadow-sm active:scale-[0.98]"
              >
                Tất cả bảng xếp hạng
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 group-hover:bg-white/20 flex items-center justify-center">
                  <ChevronRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── TOP RATED BENTO GRID (TRUYỆN HAY) ── */}
      {topRatedStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Tuyệt phẩm đề cử"
            subtitle="Những câu chuyện có điểm đánh giá cao nhất từ độc giả"
            href="/rankings?tab=favorites"
            linkLabel="Xem tất cả"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 auto-rows-[120px] sm:auto-rows-[160px]">
            {topRatedStories.slice(0, 7).map((story, i) => (
              <motion.div
                key={story.id}
                variants={cardVariant}
                className={cn(
                  "relative group rounded-[1.5rem] sm:rounded-4xl overflow-hidden border border-border-brand/50 bg-surface-brand shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)] transition-all duration-700",
                  i === 0
                    ? "col-span-2 row-span-3 md:row-span-3 lg:row-span-4"
                    : i === 1
                      ? "col-span-1 row-span-2 md:col-span-2 lg:col-span-2 md:row-span-2"
                      : "col-span-1 row-span-2",
                )}
              >
                <Link
                  href={`/stories/${story.id}`}
                  className="block h-full w-full relative"
                >
                  <Image
                    src={story.coverImage || DEFAULT_COVER}
                    alt={story.title}
                    fill
                    className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    unoptimized
                  />

                  {/* Premium Glass Content Overlay */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-linear-to-t from-black/90 via-black/40 to-transparent pt-12 group-hover:from-emerald-950/90 transition-all duration-500",
                      i === 0 ? "sm:p-8" : "",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-md text-[10px] font-black text-amber-400 border border-amber-500/20">
                        <Star size={10} fill="currentColor" />{" "}
                        {story.rating?.toFixed(1)}
                      </div>
                      {story.genres?.[0]?.name && (
                        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest truncate">
                          {story.genres?.[0]?.name}
                        </span>
                      )}
                    </div>
                    <h4
                      className={cn(
                        "font-black text-white leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors drop-shadow-lg",
                        i === 0
                          ? "text-xl sm:text-3xl"
                          : "text-sm sm:text-base",
                      )}
                    >
                      {story.title}
                    </h4>
                    {i === 0 && (
                      <p className="hidden sm:block text-white/50 text-[11px] font-medium mt-3 line-clamp-2 leading-relaxed">
                        {story.description}
                      </p>
                    )}
                  </div>

                  {i === 0 && (
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="bg-emerald-500 text-white font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/40">
                        SIÊU PHẨM
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── EXCLUSIVE STORIES (TRUYỆN ĐỘC QUYỀN) ── */}
      {exclusiveStories.length > 0 && (
        <div className="bg-surface-elevated/30 py-16 sm:py-24 my-10 sm:my-16 border-y border-border-brand/30 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary-brand/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <motion.section
            className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <SectionHeader
              title="Truyện Độc Quyền"
              subtitle="Tác phẩm bản quyền chất lượng cao chỉ có tại ChapterOne"
              href="/rankings?tab=week"
              linkLabel="Khám phá ngay"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {exclusiveStories.slice(0, 3).map((story) => (
                <motion.div
                  key={story.id}
                  variants={cardVariant}
                  whileHover={{ y: -10 }}
                  className="group relative bg-surface-brand rounded-4xl p-4 border border-border-brand/60 shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500"
                >
                  <Link href={`/stories/${story.id}`}>
                    <div className="relative aspect-4/5 rounded-4xl overflow-hidden mb-6 shadow-2xl">
                      <Image
                        src={story.coverImage || DEFAULT_COVER}
                        alt={story.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent" />
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                        ORIGINAL
                      </div>
                    </div>

                    <div className="px-2 pb-2 text-center">
                      <h4 className="text-xl font-black text-text-primary group-hover:text-emerald-500 transition-colors line-clamp-1 mb-2">
                        {story.title}
                      </h4>
                      <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed px-4">
                        {story.description}
                      </p>
                      <div className="flex items-center justify-center gap-6">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-text-muted font-bold uppercase mb-1">
                            Chương
                          </span>
                          <span className="font-black text-emerald-500">
                            {story._count?.chapters || 0}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-border-brand" />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-text-muted font-bold uppercase mb-1">
                            Đánh giá
                          </span>
                          <div className="flex items-center gap-1 font-black text-amber-500">
                            <Star size={10} fill="currentColor" />{" "}
                            {(story.rating || 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      )}

      {/* ── COMPLETED NOVELS (TRUYỆN ĐÃ HOÀN THÀNH) ── */}
      {completedStories.length > 0 && (
        <motion.section
          className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <SectionHeader
            title="Đã trọn thuật"
            subtitle="Đọc một lèo không cần chờ đợi chương mới"
            href="/stories?status=COMPLETED"
            linkLabel="Xem tủ sách Full"
          />
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8"
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
  subtitle,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-1 h-6 sm:w-1.5 sm:h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-text-primary tracking-tight uppercase leading-none">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-[10px] sm:text-sm text-text-muted font-medium ml-3 sm:ml-4.5">
            {subtitle}
          </p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group flex items-center gap-2 self-start sm:self-auto text-[9px] sm:text-xs font-black text-text-muted uppercase tracking-widest sm:tracking-widest hover:text-emerald-500 transition-all duration-300 bg-surface-elevated/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border-brand hover:border-emerald-500/20 shadow-sm"
        >
          {linkLabel}
          <div className="p-0.5 sm:p-1 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-500 group-hover:text-white transition-all">
            <ChevronRight size={10} className="sm:w-3 sm:h-3" />
          </div>
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
