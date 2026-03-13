"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, X, Grid, List as ListIcon } from "lucide-react";
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
  const [selectedGenre, setSelectedGenre] = useState<string>(
    searchParams.get("genre") || "all",
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get("type") || "all",
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "all",
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    apiFetch<Genre[]>("/stories/genres")
      .then(setGenres)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedGenre !== "all") params.set("genre", selectedGenre);
      if (selectedType !== "all") params.set("type", selectedType);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
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
  }, [search, selectedGenre, selectedType, selectedStatus, page]);

  const clearFilters = () => {
    setSearch("");
    setSelectedGenre("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setPage(1);
  };

  const hasFilters = search || selectedGenre !== "all" || selectedType !== "all" || selectedStatus !== "all";

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
    <div className="min-h-screen bg-[#020617] pt-24 pb-20 overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              Duyệt <span className="text-[#10b981]">Truyện</span>
            </h1>
            <p className="text-slate-400 max-w-lg font-medium">
              Khám phá hàng ngàn bộ truyện hấp dẫn, đa dạng thể loại từ khắp nơi trên thế giới.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="bg-white/5 border-white/10 text-white cursor-pointer hover:bg-[#10b981] hover:text-[#020617] hover:border-[#10b981] transition-all">
              <Grid size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 cursor-pointer hover:text-white transition-all">
              <ListIcon size={18} />
            </Button>
          </div>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-12 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#10b981] transition-colors" size={18} />
              <Input
                placeholder="Tìm kiếm truyện theo tên, tác giả..."
                className="pl-10 h-11 bg-white/5 border-white/10 text-white focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/50 rounded-xl transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Genre */}
            <Select value={selectedGenre} onValueChange={(val) => { if (val) { setSelectedGenre(val); setPage(1); } }}>
              <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white rounded-xl focus:ring-[#10b981]/50">
                <SelectValue placeholder="Tất cả thể loại" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                <SelectItem value="all">Tất cả thể loại</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={selectedType} onValueChange={(val) => { if (val) { setSelectedType(val); setPage(1); } }}>
              <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white rounded-xl focus:ring-[#10b981]/50">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="NOVEL">Novel</SelectItem>
                <SelectItem value="MANGA">Manga</SelectItem>
                <SelectItem value="COMIC">Comic</SelectItem>
                <SelectItem value="LIGHTNOVEL">Light Novel</SelectItem>
              </SelectContent>
            </Select>

            {/* Status & Clear */}
            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={(val) => { if (val) { setSelectedStatus(val); setPage(1); } }}>
                <SelectTrigger className="flex-1 h-11 bg-white/5 border-white/10 text-white rounded-xl focus:ring-[#10b981]/50">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ONGOING">Đang ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="HIATUS">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
              
              {hasFilters && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearFilters}
                  className="h-11 w-11 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Xóa bộ lọc"
                >
                  <X size={18} />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Story Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[2/3] w-full bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
                </div>
              ))}
            </motion.div>
          ) : stories.length > 0 ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10"
            >
              {stories.map((story) => (
                <motion.div key={story.id} variants={itemVariants}>
                  <StoryCard story={story} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <Filter size={32} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy truyện</h3>
              <p className="text-slate-400 mb-8 max-w-xs">
                Chúng tôi không tìm thấy bộ truyện nào phù hợp với bộ lọc hiện tại của bạn.
              </p>
              <Button onClick={clearFilters} className="bg-[#10b981] hover:bg-[#0da673] text-[#020617] font-bold rounded-xl px-8 transition-all">
                Xóa tất cả bộ lọc
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Integration */}
        {totalPages > 1 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20"
          >
            <Pagination>
              <PaginationContent className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-2xl gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                    className={cn(
                      "text-slate-400 hover:text-white border-transparent",
                      page <= 1 && "pointer-events-none opacity-20"
                    )}
                    text="Trước"
                  />
                </PaginationItem>
                
                {/* Generate page numbers logic */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = page - 2 + i;
                  if (pageNum <= 0) pageNum = i + 1;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        href="#" 
                        isActive={page === pageNum}
                        onClick={(e) => { e.preventDefault(); setPage(pageNum); }}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-all",
                          page === pageNum 
                            ? "bg-[#10b981] text-[#020617] border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                            : "text-slate-400 hover:text-white border-transparent hover:bg-white/5"
                        )}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && page < totalPages - 2 && (
                   <>
                     <PaginationItem><PaginationEllipsis className="text-slate-600" /></PaginationItem>
                     <PaginationItem>
                       <PaginationLink 
                         href="#" 
                         onClick={(e) => { e.preventDefault(); setPage(totalPages); }}
                         className="text-slate-400 hover:text-white border-transparent hover:bg-white/5"
                        >
                         {totalPages}
                       </PaginationLink>
                     </PaginationItem>
                   </>
                )}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                    className={cn(
                      "text-slate-400 hover:text-white border-transparent",
                      page >= totalPages && "pointer-events-none opacity-20"
                    )}
                    text="Sau"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
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
