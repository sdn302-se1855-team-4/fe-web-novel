"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Activity,
  Layers,
  SortAsc,
  BookOpen,
  Star,
  Tags,
  RotateCcw,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import StoryCard from "@/components/StoryCard";

interface Story {
  id: string;
  title: string;
  coverImage?: string;
  type?: string;
  status?: string;
  viewCount?: number;
  rating?: number;
  author?: { id: string; name: string };
  genres?: { id: string; name: string }[];
  _count?: { chapters: number };
}

interface Genre {
  id: string;
  name: string;
}

function StoriesContent() {
  const searchParams = useSearchParams();

  const [stories, setStories] = useState<Story[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get("genres")?.split(",").filter(Boolean) ||
    (searchParams.get("genre") ? [searchParams.get("genre") as string] : [])
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get("type") || "Tất cả"
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "Tất cả"
  );
  const [selectedChapters, setSelectedChapters] = useState<string>(
    searchParams.get("chapters") || "0"
  );
  const [selectedSort, setSelectedSort] = useState<string>(
    searchParams.get("sort") || "Tất cả"
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(
    searchParams.get("timeframe") || "Tất cả"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    apiFetch<Genre[]>("/stories/genres")
      .then(setGenres)
      .catch(() => { });
  }, []);

  useEffect(() => {
    const genre = searchParams.get("genre") || searchParams.get("genreId");
    if (genre) {
      setSelectedGenres([genre]);
    } else {
      const genresParam = searchParams.get("genres");
      setSelectedGenres(genresParam ? genresParam.split(",").filter(Boolean) : []);
    }
    setSearch(searchParams.get("search") || "");
    setSelectedType(searchParams.get("type") || "Tất cả");
    setSelectedStatus(searchParams.get("status") || "Tất cả");
    setSelectedChapters(searchParams.get("chapters") || "0");
    setSelectedSort(searchParams.get("sort") || "Tất cả");
    setSelectedTimeframe(searchParams.get("timeframe") || "Tất cả");
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedGenres.length > 0) params.set("genreId", selectedGenres[0]);

    if (selectedType && selectedType !== "Tất cả") {
      const typeMap: Record<string, string> = { "Novel": "NOVEL", "Manga": "MANGA", "Comic": "COMIC", "Light Novel": "LIGHTNOVEL" };
      params.set("type", typeMap[selectedType] || selectedType);
    }

    if (selectedStatus && selectedStatus !== "Tất cả") {
      const statusMap: Record<string, string> = { "Đang ra": "ONGOING", "Hoàn thành": "COMPLETED", "Tạm dừng": "HIATUS" };
      params.set("status", statusMap[selectedStatus] || selectedStatus);
    }

    if (selectedChapters !== "0") params.set("minChapters", selectedChapters);

    if (selectedSort && selectedSort !== "Tất cả") {
      const sortMap: Record<string, string> = { "Mới nhất": "createdAt", "Xem nhiều nhất": "viewCount", "Đánh giá cao": "rating", "Mới cập nhật": "updatedAt" };
      params.set("sortBy", sortMap[selectedSort] || selectedSort);
    }

    if (selectedTimeframe && selectedTimeframe !== "Tất cả") {
      params.set("sortBy", "viewCount");
    }
    params.set("page", String(page));
    params.set("limit", "12");

    apiFetch<{ data: Story[]; totalPages?: number } | Story[]>(
      `/stories?${params.toString()}`
    )
      .then((res) => {
        if (Array.isArray(res)) {
          setStories(res);
        } else {
          setStories(res.data || []);
          if (res.totalPages) setTotalPages(res.totalPages);
        }
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, selectedGenres, selectedType, selectedStatus, selectedChapters, selectedSort, page]);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedGenres([]);
    setSelectedType("Tất cả");
    setSelectedStatus("Tất cả");
    setSelectedChapters("0");
    setSelectedSort("Tất cả");
    setSelectedTimeframe("Tất cả");
    setPage(1);
  };

  const selectedGenre = selectedGenres.length > 0 ? selectedGenres[0] : "";
  const hasFilters =
    search ||
    selectedGenres.length > 0 ||
    selectedType ||
    selectedStatus ||
    selectedChapters !== "0";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  /* shared class strings */
  const triggerCls =
    "h-9 min-w-[140px] bg-surface-elevated border-border-brand text-text-primary text-sm rounded-md focus:ring-1 focus:ring-emerald-500/50 transition-all hover:border-emerald-500/40";
  const contentCls =
    "bg-surface-elevated border-border-brand rounded-md shadow-xl";
  const itemCls =
    "py-1.5 text-sm cursor-pointer focus:bg-emerald-500 focus:text-white";
  const labelCls =
    "hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap";

  return (
    <div className="page-wrapper bg-bg-brand pb-20 overflow-x-hidden">
      {/* decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* ── PAGE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-2 tracking-tight pt-0">
            Danh sách <span className="text-emerald-500">truyện</span>
          </h1>
          <p className="text-text-muted font-medium">
            Khám phá hàng ngàn bộ truyện hấp dẫn, đa dạng thể loại.
          </p>
        </motion.div>

        {/* ── FILTER TOOLBAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8 space-y-3"
        >
          {/* Search bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tên truyện, tác giả..."
              className="w-full h-10 pl-9 pr-4 bg-surface-brand border border-border-brand text-text-primary text-sm rounded-md placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/40 transition-all"
            />
          </div>

          {/* Filter panel */}
          <div className="bg-surface-brand border border-border-brand rounded-md overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-brand bg-surface-elevated/30">
              <span className="flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                <Filter size={12} className="text-emerald-500" />
                Bộ lọc nhanh
              </span>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-bold uppercase tracking-wider"
                >
                  <RotateCcw size={11} />
                  Đặt lại
                </button>
              )}
            </div>

            {/* Selects row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
              {/* Thể loại */}
              <div className="flex items-center gap-2">
                <span className={labelCls}>
                  <Tags size={11} className="text-emerald-500" />
                  Thể loại
                </span>
                <Select
                  value={selectedGenre || ""}
                  onValueChange={(val) => {
                    setSelectedGenres(val ? [val] : []);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder="Tất cả">
                      {selectedGenre
                        ? (genres.find((g) => g.id === selectedGenre)?.name ?? "Tất cả")
                        : "Tất cả"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="" className={itemCls}>Tất cả</SelectItem>
                    {genres.map((g) => (
                      <SelectItem key={g.id} value={g.id} className={itemCls}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:block w-px h-4 bg-border-brand" />

              {/* Tình trạng */}
              <div className="flex items-center gap-2">
                <span className={labelCls}>
                  <Activity size={11} className="text-emerald-500" />
                  Tình trạng
                </span>
                <Select
                  value={selectedStatus || ""}
                  onValueChange={(val) => {
                    setSelectedStatus(val || "");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="Tất cả" className={itemCls}>Tất cả</SelectItem>
                    <SelectItem value="Đang ra" className={itemCls}>Đang ra</SelectItem>
                    <SelectItem value="Hoàn thành" className={itemCls}>Hoàn thành</SelectItem>
                    <SelectItem value="Tạm dừng" className={itemCls}>Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:block w-px h-4 bg-border-brand" />

              {/* Loại truyện */}
              <div className="flex items-center gap-2">
                <span className={labelCls}>
                  <BookOpen size={11} className="text-emerald-500" />
                  Loại
                </span>
                <Select
                  value={selectedType || ""}
                  onValueChange={(val) => {
                    setSelectedType(val || "");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="Tất cả" className={itemCls}>Tất cả</SelectItem>
                    <SelectItem value="Novel" className={itemCls}>Novel</SelectItem>
                    <SelectItem value="Manga" className={itemCls}>Manga</SelectItem>
                    <SelectItem value="Comic" className={itemCls}>Comic</SelectItem>
                    <SelectItem value="Light Novel" className={itemCls}>Light Novel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:block w-px h-4 bg-border-brand" />

              {/* Xếp hạng thời gian */}

              {/* Xếp hạng thời gian */}
              <div className="flex items-center gap-2">
                <span className={labelCls}>
                  <Flame size={11} className="text-emerald-500" />
                  Xếp hạng
                </span>
                <Select
                  value={selectedTimeframe || "Tất cả"}
                  onValueChange={(val) => {
                    setSelectedTimeframe(val || "Tất cả");
                    setSelectedSort("Tất cả");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="Tất cả" className={itemCls}>Tất cả</SelectItem>
                    <SelectItem value="Top ngày" className={itemCls}>Top Ngày</SelectItem>
                    <SelectItem value="Top tháng" className={itemCls}>Top Tháng</SelectItem>
                    <SelectItem value="Top năm" className={itemCls}>Top Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:block w-px h-4 bg-border-brand" />

              {/* Sắp xếp */}
              <div className="flex items-center gap-2">
                <span className={labelCls}>
                  <SortAsc size={11} className="text-emerald-500" />
                  Sắp xếp
                </span>
                <Select
                  value={selectedSort || ""}
                  onValueChange={(val) => {
                    setSelectedSort(val || "Tất cả");
                    setSelectedTimeframe("Tất cả");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="Tất cả" className={itemCls}>Tất cả</SelectItem>
                    <SelectItem value="Mới nhất" className={itemCls}>Mới nhất</SelectItem>
                    <SelectItem value="Xem nhiều nhất" className={itemCls}>Xem nhiều nhất</SelectItem>
                    <SelectItem value="Đánh giá cao" className={itemCls}>Đánh giá cao</SelectItem>
                    <SelectItem value="Mới cập nhật" className={itemCls}>Mới cập nhật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── STORY LIST ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-brand/50 border border-border-brand/50 rounded-2xl overflow-hidden aspect-[2/3.5] animate-pulse"
                >
                  <div className="w-full aspect-[2/3] bg-surface-elevated/80" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-surface-elevated rounded w-3/4 mx-auto" />
                    <div className="h-3 bg-surface-elevated rounded w-1/2 mx-auto" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : stories.length > 0 ? (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-10"
            >
              {stories.map((story) => (
                <motion.div key={story.id} variants={itemVariants}>
                  <StoryCard story={story} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-24 flex flex-col items-center text-center">
              <Search size={48} className="text-text-muted mb-6" />
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Không tìm thấy truyện
              </h3>
              <p className="text-text-muted max-w-xs mb-8">
                Hãy thử thay đổi tiêu chí lọc hoặc xóa bộ lọc để xem tất cả truyện.
              </p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-border-brand h-9 px-8 rounded-md text-text-muted hover:text-text-primary transition-colors text-sm"
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </AnimatePresence>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && !loading && (
          <div className="mt-16">
            <Pagination>
              <PaginationContent className="bg-surface-brand border border-border-brand p-1 rounded-md gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={cn(
                      "text-text-muted hover:text-text-primary border-transparent rounded-md",
                      page <= 1 && "pointer-events-none opacity-20"
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                      className={cn(
                        "w-9 h-9 rounded-md transition-all text-sm",
                        page === i + 1
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "text-text-muted hover:text-text-primary border-transparent hover:bg-surface-elevated"
                      )}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={cn(
                      "text-text-muted hover:text-text-primary border-transparent rounded-md",
                      page >= totalPages && "pointer-events-none opacity-20"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-bold">
          Đang tải...
        </div>
      }
    >
      <StoriesContent />
    </Suspense>
  );
}
