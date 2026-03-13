"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, X, Grid, List as ListIcon, Tags, Globe, Activity, Layers, SortAsc, BookOpen, Link, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import StoryCard from "@/components/StoryCard";
import { Input } from "@/components/ui/input";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
    searchParams.get("genres")?.split(",") || (searchParams.get("genre") ? [searchParams.get("genre")!] : [])
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get("type") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "",
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(
    searchParams.get("country") || "",
  );
  const [selectedChapters, setSelectedChapters] = useState<string>(
    searchParams.get("chapters") || "0",
  );
  const [selectedSort, setSelectedSort] = useState<string>(
    searchParams.get("sort") || "createdAt",
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
    const fetchStories = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));
      if (selectedType) params.set("type", selectedType);
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedCountry) params.set("country", selectedCountry);
      if (selectedChapters !== "0") params.set("minChapters", selectedChapters);
      if (selectedSort) params.set("sortBy", selectedSort);

      params.set("page", String(page));
      params.set("limit", "12");

      apiFetch<{ data: Story[]; totalPages?: number } | Story[]>(
        `/stories?${params.toString()}`,
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
    };
    fetchStories();
  }, [debouncedSearch, selectedGenres, selectedType, selectedStatus, selectedCountry, selectedChapters, selectedSort, page]);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedGenres([]);
    setSelectedType("");
    setSelectedStatus("");
    setSelectedCountry("");
    setSelectedChapters("0");
    setSelectedSort("createdAt");
    setPage(1);
  };

  const selectedGenre = selectedGenres.length > 0 ? selectedGenres[0] : "";

  const hasFilters = search || selectedGenres.length > 0 || selectedType || selectedStatus || selectedCountry || selectedChapters !== "0";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="page-wrapper bg-bg-brand pb-20 overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-2 tracking-tight pt-12">
              Danh sách <span className="text-emerald-500">truyện</span>
            </h1>
            <p className="text-text-muted max-w-lg font-medium">
              Khám phá hàng ngàn bộ truyện hấp dẫn, đa dạng thể loại từ khắp nơi trên thế giới.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-brand backdrop-blur-sm border border-border-brand rounded-2xl p-8 mb-12 shadow-sm"
        >
          <div className="space-y-6">
            <div className="px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                {/* Thể loại */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
                    <Tags size={14} className="text-emerald-500" />
                    Thể loại
                  </label>
                  <Select value={selectedGenre || ""} onValueChange={(val: string | null) => { setSelectedGenres(val === "" ? [] : (val ? [val] : [])); setPage(1); }}>
                    <SelectTrigger className="w-full h-10 bg-surface-elevated border-border-brand text-text-primary rounded-md focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all duration-200">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border-brand rounded-xl shadow-lg">
                      <SelectItem value="" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Tất cả</SelectItem>
                      {genres.map(g => (
                        <SelectItem key={g.id} value={g.id} className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Quốc gia */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
                    <Globe size={14} className="text-emerald-500" />
                    Quốc gia
                  </label>
                  <Select value={selectedCountry || ""} onValueChange={(val: string | null) => { setSelectedCountry(val || ""); setPage(1); }}>
                    <SelectTrigger className="w-full h-10 bg-surface-elevated border-border-brand text-text-primary rounded-md focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all duration-200">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border-brand rounded-xl shadow-lg">
                      <SelectItem value="all" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Tất cả</SelectItem>
                      <SelectItem value="vn" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Việt Nam</SelectItem>
                      <SelectItem value="cn" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Trung Quốc</SelectItem>
                      <SelectItem value="kr" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Hàn Quốc</SelectItem>
                      <SelectItem value="jp" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Nhật Bản</SelectItem>
                      <SelectItem value="us" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Mỹ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tình trạng */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
                    <Activity size={14} className="text-emerald-500" />
                    Tình Trạng
                  </label>
                  <Select value={selectedStatus || ""} onValueChange={(val: string | null) => { setSelectedStatus(val || ""); setPage(1); }}>
                    <SelectTrigger className="w-full h-10 bg-surface-elevated border-border-brand text-text-primary rounded-md focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all duration-200">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border-brand rounded-xl shadow-lg">
                      <SelectItem value="all" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Tất cả</SelectItem>
                      <SelectItem value="ONGOING" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Đang ra</SelectItem>
                      <SelectItem value="COMPLETED" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Hoàn thành</SelectItem>
                      <SelectItem value="HIATUS" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Số lượng chương */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
                    <Layers size={14} className="text-emerald-500" />
                    Số lượng chương
                  </label>
                  <Select value={selectedChapters === "0" ? "" : selectedChapters} onValueChange={(val: string | null) => { setSelectedChapters(val || "0"); setPage(1); }}>
                    <SelectTrigger className="w-full h-10 bg-surface-elevated border-border-brand text-text-primary rounded-md focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all duration-200">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border-brand rounded-xl shadow-lg">
                      <SelectItem value="0" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">{">"} 0</SelectItem>
                      <SelectItem value="50" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">{">"} 50</SelectItem>
                      <SelectItem value="100" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">{">"} 100</SelectItem>
                      <SelectItem value="200" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">{">"} 200</SelectItem>
                      <SelectItem value="500" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">{">"} 500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sắp xếp */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
                    <SortAsc size={14} className="text-emerald-500" />
                    Sắp xếp
                  </label>
                  <Select value={selectedSort === "createdAt" ? "" : selectedSort} onValueChange={(val: string | null) => { setSelectedSort(val || "createdAt"); setPage(1); }}>
                    <SelectTrigger className="w-full h-10 bg-surface-elevated border-border-brand text-text-primary rounded-md focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all duration-200">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border-brand rounded-xl shadow-lg">
                      <SelectItem value="createdAt" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Ngày đăng giảm dần</SelectItem>
                      <SelectItem value="viewCount" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Lượt xem nhiều nhất</SelectItem>
                      <SelectItem value="rating" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Đánh giá cao nhất</SelectItem>
                      <SelectItem value="updatedAt" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Mới cập nhật</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Loại truyện */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
                    <BookOpen size={14} className="text-emerald-500" />
                    Loại truyện
                  </label>
                  <Select value={selectedType || ""} onValueChange={(val: string | null) => { setSelectedType(val || ""); setPage(1); }}>
                    <SelectTrigger className="w-full h-10 bg-surface-elevated border-border-brand text-text-primary rounded-md focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all duration-200">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border-brand rounded-xl shadow-lg">
                      <SelectItem value="all" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Tất cả</SelectItem>
                      <SelectItem value="NOVEL" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Novel</SelectItem>
                      <SelectItem value="MANGA" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Manga</SelectItem>
                      <SelectItem value="COMIC" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Comic</SelectItem>
                      <SelectItem value="LIGHTNOVEL" className="py-1.5 focus:bg-blue-600 focus:text-white cursor-pointer">Light Novel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="flex justify-center flex-wrap gap-4 pt-6">
              <Button
                className="btn btn-primary h-10 px-10 rounded-xl shadow-sm uppercase text-xs tracking-widest"
                onClick={() => setPage(1)}
              >
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                className="btn btn-outline h-10 px-10 border-border-brand rounded-xl uppercase text-xs tracking-widest hover:border-rose-500 hover:text-rose-500"
                onClick={clearFilters}
              >
                Mặc định
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Story Grid - List Style Reverted */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-6 animate-pulse">
                  <div className="hidden md:block w-8 shrink-0" />
                  <div className="w-24 md:w-32 aspect-[2/3] shrink-0 bg-white/5 rounded-xl" />
                  <div className="flex-1 space-y-4 py-2">
                    <div className="h-6 bg-white/5 rounded w-1/3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded w-full" />
                      <div className="h-3 bg-white/5 rounded w-2/3" />
                    </div>
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
              className="space-y-4"
            >
              {stories.map((story, index) => (
                <motion.div key={story.id} variants={itemVariants}>
                  <Link href={`/stories/${story.id}`}>
                    <div className="group bg-surface-brand border border-border-brand p-4 rounded-2xl flex gap-6 hover:border-emerald-500/30 transition-all hover:shadow-lg">
                      {/* Rank Number */}
                      <div className="hidden md:flex items-center justify-center w-8 shrink-0">
                        <span className={cn(
                          "text-2xl font-black italic",
                          index < 3 ? "text-emerald-500" : "text-text-muted"
                        )}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Cover */}
                      <div className="w-24 md:w-32 aspect-[2/3] shrink-0 overflow-hidden rounded-xl border border-white/10">
                        <img
                          src={story.coverImage || "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop"}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-text-primary group-hover:text-emerald-500 transition-colors line-clamp-1">
                              {story.title}
                            </h3>
                            <p className="text-sm font-medium text-emerald-500/80 mt-1">
                              {story.author?.name || "Ẩn danh"}
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1 text-amber-500 font-bold">
                            <Star size={14} fill="currentColor" />
                            <span>{story.rating?.toFixed(1) || "5.0"}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-text-muted mt-3 line-clamp-2 md:line-clamp-3 hidden sm:block">
                          {story.title} - Một tác phẩm hấp dẫn. Khám phá ngay hành trình đầy kịch tính của các nhân vật...
                        </p>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[13px] font-bold uppercase tracking-wider text-text-muted">
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <Filter size={14} />
                            {story.type}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <BookOpen size={14} />
                            {story._count?.chapters || 0} Chương
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px]",
                            story.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-24 flex flex-col items-center text-center">
              <Search size={48} className="text-text-muted mb-6" />
              <h3 className="text-xl font-bold text-text-primary mb-2">Không tìm thấy truyện</h3>
              <p className="text-text-muted max-w-xs mb-8">Hãy thử thay đổi tiêu chí lọc hoặc xóa bộ lọc để xem tất cả truyện.</p>
              <Button onClick={clearFilters} variant="outline" className="btn btn-outline border-border-brand h-10 px-8 rounded-full text-text-muted hover:text-text-primary transition-colors">Xóa bộ lọc</Button>
            </div>
          )}
        </AnimatePresence>

        {/* Pagination Reverted */}
        {totalPages > 1 && !loading && (
          <div className="mt-20">
            <Pagination>
              <PaginationContent className="bg-surface-brand backdrop-blur-md border border-border-brand p-1 rounded-2xl gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if(page > 1) setPage(page-1); }}
                    className={cn("text-text-muted hover:text-text-primary border-transparent", page <= 1 && "pointer-events-none opacity-20")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#" 
                      isActive={page === i + 1}
                      onClick={(e) => { e.preventDefault(); setPage(i+1); }}
                      className={cn(
                        "w-10 h-10 rounded-xl transition-all",
                        page === i+1 ? "bg-emerald-500 text-white border-emerald-500" : "text-text-muted hover:text-text-primary border-transparent hover:bg-surface-elevated"
                      )}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if(page < totalPages) setPage(page+1); }}
                    className={cn("text-text-muted hover:text-text-primary border-transparent", page >= totalPages && "pointer-events-none opacity-20")}
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
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-bold">Đang tải...</div>}>
      <StoriesContent />
    </Suspense>
  );
}
