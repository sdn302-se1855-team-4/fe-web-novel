"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Filter,
  Activity,
  SortAsc,
  BookOpen,
  Search,
  Tags,
  RotateCcw,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { cn, removeAccents } from "@/lib/utils";
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
  PaginationEllipsis,
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
  const [search, setSearch] = useState<string>(
    searchParams.get("search") || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get("genres")?.split(",").filter(Boolean) ||
      (searchParams.get("genre") ? [searchParams.get("genre") as string] : []),
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get("type") || "Tất cả",
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "Tất cả",
  );
  const [selectedChapters, setSelectedChapters] = useState<string>(
    searchParams.get("chapters") || "0",
  );
  const [selectedSort, setSelectedSort] = useState<string>(
    searchParams.get("sort") || "Tất cả",
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(
    searchParams.get("timeframe") || "Tất cả",
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    const genre = searchParams.get("genre") || searchParams.get("genreId");
    if (genre) {
      requestAnimationFrame(() => setSelectedGenres([genre]));
    } else {
      const genresParam = searchParams.get("genres");
      if (genresParam) {
        requestAnimationFrame(() => setSelectedGenres(genresParam.split(",").filter(Boolean)));
      } else {
        requestAnimationFrame(() => setSelectedGenres([]));
      }
    }
    requestAnimationFrame(() => {
      setSearch(searchParams.get("search") || "");
      setSelectedType(searchParams.get("type") || "Tất cả");
      setSelectedStatus(searchParams.get("status") || "Tất cả");
      setSelectedChapters(searchParams.get("chapters") || "0");
      setSelectedSort(searchParams.get("sort") || "Tất cả");
    });
    requestAnimationFrame(() => {
      setSelectedTimeframe(searchParams.get("timeframe") || "Tất cả");
      setPage(1);
    });
  }, [searchParams]);

  useEffect(() => {
    requestAnimationFrame(() => setLoading(true));
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", removeAccents(debouncedSearch));
    if (selectedGenres.length > 0) params.set("genreId", selectedGenres[0]);

    if (selectedType && selectedType !== "Tất cả") {
      const typeMap: Record<string, string> = {
        Novel: "NOVEL",
        Manga: "MANGA",
        Comic: "COMIC",
        "Light Novel": "LIGHTNOVEL",
      };
      params.set("type", typeMap[selectedType] || selectedType);
    }

    if (selectedStatus && selectedStatus !== "Tất cả") {
      const statusMap: Record<string, string> = {
        "Đang ra": "ONGOING",
        "Hoàn thành": "COMPLETED",
        "Tạm dừng": "HIATUS",
      };
      params.set("status", statusMap[selectedStatus] || selectedStatus);
    }

    if (selectedChapters !== "0") params.set("minChapters", selectedChapters);

    if (selectedSort && selectedSort !== "Tất cả") {
      const sortMap: Record<string, string> = {
        "Mới nhất": "createdAt",
        "Xem nhiều nhất": "viewCount",
        "Đánh giá cao": "rating",
        "Mới cập nhật": "updatedAt",
      };
      params.set("sortBy", sortMap[selectedSort] || selectedSort);
    }

    if (selectedTimeframe && selectedTimeframe !== "Tất cả") {
      params.set("sortBy", "viewCount");
    }
    params.set("page", String(page));
    params.set("limit", "12");

    apiFetch<{ data: Story[]; totalPages?: number } | Story[]>(
      `/stories?${params.toString()}`,
    )
      .then((res) => {
        let rawStories: Story[] = [];
        let totalP: number = 1;

        if (Array.isArray(res)) {
          rawStories = res;
        } else {
          rawStories = res.data || [];
          if (res.totalPages) totalP = res.totalPages;
        }

        // Apply client-side filtering as a robust layer over backend results
        if (debouncedSearch) {
          const normalizedQuery = removeAccents(debouncedSearch.toLowerCase());
          const filtered = rawStories.filter(story => {
            const normalizedTitle = removeAccents(story.title.toLowerCase());
            const normalizedAuthor = removeAccents((story.author?.name || "").toLowerCase());
            return normalizedTitle.includes(normalizedQuery) || normalizedAuthor.includes(normalizedQuery);
          });
          setStories(filtered);
        } else {
          setStories(rawStories);
        }
        setTotalPages(totalP);
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [
    debouncedSearch,
    selectedGenres,
    selectedType,
    selectedStatus,
    selectedChapters,
    selectedSort,
    selectedTimeframe,
    page,
  ]);

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
    "h-9 w-full sm:min-w-[140px] sm:w-auto bg-surface-elevated border-border-brand text-text-primary text-sm rounded-md focus:ring-1 focus:ring-emerald-500/50 transition-all hover:not-disabled:border-emerald-500/40";
  const contentCls =
    "bg-surface-elevated border-border-brand rounded-md shadow-xl";
  const itemCls =
    "py-1.5 text-sm cursor-pointer focus:bg-emerald-500 focus:text-white";
  const labelCls =
    "text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest whitespace-nowrap";

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (page <= 3) {
        items.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (page >= totalPages - 2) {
        items.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
      }
    }

    return items.map((item, idx) => {
      if (item === 'ellipsis') {
        return (
          <PaginationItem key={`ellipsis-${idx}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={item}>
          <PaginationLink
            href="#"
            isActive={page === item}
            onClick={(e) => {
              e.preventDefault();
              setPage(item as number);
            }}
            className={cn(
              "w-9 h-9 rounded-md transition-all text-sm",
              page === item
                ? "bg-emerald-500 text-white border-emerald-500"
                : "text-text-muted hover:text-text-primary border-transparent hover:bg-surface-elevated",
            )}
          >
            {item}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

  return (
    <div className="min-h-screen bg-bg-brand pb-20 overflow-x-hidden">
      {/* decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 relative z-10">
        {/* ── PAGE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-5"
        >
          <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-1 tracking-tight">
            Danh sách <span className="text-emerald-500">truyện</span>
          </h1>
          <p className="text-sm text-text-muted font-medium">
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
                  <RotateCcw size={11} className="transition-transform group-hover:rotate-180 duration-500" />
                  Đặt lại
                </button>
              )}
            </div>

            {/* Selects grid — 2 cols on mobile, flex row on sm+ */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end sm:items-center gap-3 px-4 py-3">
              {/* Thể loại */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                <span className={labelCls}>
                  <Tags size={10} className="inline mr-0.5" />
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
                        ? (genres.find((g) => g.id === selectedGenre)?.name ??
                          "Tất cả")
                        : "Tất cả"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="" className={itemCls}>
                      Tất cả
                    </SelectItem>
                    {genres.map((g) => (
                      <SelectItem key={g.id} value={g.id} className={itemCls}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tình trạng */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                <span className={labelCls}>
                  <Activity size={10} className="inline mr-0.5" />
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
                    <SelectItem value="Tất cả" className={itemCls}>
                      Tất cả
                    </SelectItem>
                    <SelectItem value="Đang ra" className={itemCls}>
                      Đang ra
                    </SelectItem>
                    <SelectItem value="Hoàn thành" className={itemCls}>
                      Hoàn thành
                    </SelectItem>
                    <SelectItem value="Tạm dừng" className={itemCls}>
                      Tạm dừng
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loại truyện */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                <span className={labelCls}>
                  <BookOpen size={10} className="inline mr-0.5" />
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
                    <SelectItem value="Tất cả" className={itemCls}>
                      Tất cả
                    </SelectItem>
                    <SelectItem value="Novel" className={itemCls}>
                      Novel
                    </SelectItem>
                    <SelectItem value="Manga" className={itemCls}>
                      Manga
                    </SelectItem>
                    <SelectItem value="Comic" className={itemCls}>
                      Comic
                    </SelectItem>
                    <SelectItem value="Light Novel" className={itemCls}>
                      Light Novel
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Xếp hạng */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                <span className={labelCls}>
                  <Flame size={10} className="inline mr-0.5" />
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
                    <SelectItem value="Tất cả" className={itemCls}>
                      Tất cả
                    </SelectItem>
                    <SelectItem value="Top ngày" className={itemCls}>
                      Top Ngày
                    </SelectItem>
                    <SelectItem value="Top tháng" className={itemCls}>
                      Top Tháng
                    </SelectItem>
                    <SelectItem value="Top năm" className={itemCls}>
                      Top Năm
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sắp xếp */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 col-span-2 sm:col-span-1">
                <span className={labelCls}>
                  <SortAsc size={10} className="inline mr-0.5" />
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
                    <SelectItem value="Tất cả" className={itemCls}>
                      Tất cả
                    </SelectItem>
                    <SelectItem value="Mới nhất" className={itemCls}>
                      Mới nhất
                    </SelectItem>
                    <SelectItem value="Xem nhiều nhất" className={itemCls}>
                      Xem nhiều nhất
                    </SelectItem>
                    <SelectItem value="Đánh giá cao" className={itemCls}>
                      Đánh giá cao
                    </SelectItem>
                    <SelectItem value="Mới cập nhật" className={itemCls}>
                      Mới cập nhật
                    </SelectItem>
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
                  className="bg-surface-brand/50 border border-border-brand/50 rounded-2xl overflow-hidden aspect-2/3.5 animate-pulse"
                >
                  <div className="w-full aspect-2/3 bg-surface-elevated/80" />
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
                Hãy thử thay đổi tiêu chí lọc hoặc xóa bộ lọc để xem tất cả
                truyện.
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
                      page <= 1 && "pointer-events-none opacity-20",
                    )}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={cn(
                      "text-text-muted hover:text-text-primary border-transparent rounded-md",
                      page >= totalPages && "pointer-events-none opacity-20",
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
