"use client";

import { useEffect, useState } from "react";
import { 
  Flame, 
  Award, 
  Sparkles,
  Filter,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import StoryCard from "@/components/StoryCard";
import { Skeleton } from "@/components/ui/skeleton";

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

const RANK_TABS = [
  { key: "day", label: "Top Ngày", icon: Flame },
  { key: "week", label: "Top Tuần", icon: Award },
  { key: "month", label: "Top Tháng", icon: Sparkles },
] as const;

const STATUS_FILTERS = [
  { key: "ONGOING", label: "Đang tiến hành" },
  { key: "COMPLETED", label: "Hoàn thành" },
];

const COUNTRY_FILTERS = [
  { key: "cn", label: "Trung Quốc" },
  { key: "vn", label: "Việt Nam" },
  { key: "kr", label: "Hàn Quốc" },
  { key: "jp", label: "Nhật Bản" },
  { key: "us", label: "Mỹ" },
];

interface RankingsContentProps {
  activeTab: "day" | "week" | "month";
}

export default function RankingsContent({ activeTab }: RankingsContentProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankedStories = async () => {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.set("limit", "18");
      params.set("sortBy", "viewCount");
      params.set("sortOrder", "desc");

      if (selectedStatus) params.set("status", selectedStatus);
      
      try {
        const res = await apiFetch<{ data: Story[] } | Story[]>(`/stories?${params.toString()}`);
        setStories(Array.isArray(res) ? res : (res as { data: Story[] }).data || []);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankedStories();
  }, [activeTab, selectedStatus, selectedCountry]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const currentTabLabel = RANK_TABS.find(t => t.key === activeTab)?.label || "Xếp Hạng";

  return (
    <div className="page-wrapper bg-bg-brand pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Title & Icon */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3.5 rounded-2xl bg-primary-brand/10 text-primary-brand shadow-sm border border-primary-brand/20">
            {(() => {
              const TabIcon = RANK_TABS.find((t) => t.key === activeTab)?.icon || Award;
              return <TabIcon size={28} />;
            })()}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight uppercase leading-none">
              {currentTabLabel}
            </h1>
            <p className="text-text-muted text-sm mt-1 font-medium italic">
              Khám phá những bộ truyện hot nhất trong {activeTab === "day" ? "ngày" : activeTab === "week" ? "tuần" : "tháng"}
            </p>
          </div>
        </div>

        {/* Filters Box */}
        <div className="bg-surface-brand border border-border-brand rounded-3xl p-6 md:p-8 mb-12 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Filter size={60} />
          </div>
          <div className="space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-16">
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="p-2 rounded-lg bg-surface-elevated text-text-muted">
                  <Filter size={16} />
                </div>
                <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Tình trạng</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setSelectedStatus(selectedStatus === f.key ? null : f.key)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300",
                      selectedStatus === f.key
                        ? "bg-primary-brand text-white border-primary-brand shadow-lg shadow-primary-brand/20"
                        : "bg-surface-elevated border-border-brand text-text-secondary hover:border-primary-brand/50 hover:bg-surface-brand"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-16">
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="p-2 rounded-lg bg-surface-elevated text-text-muted">
                  <Globe size={16} />
                </div>
                <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Quốc gia</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {COUNTRY_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setSelectedCountry(selectedCountry === f.key ? null : f.key)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300",
                      selectedCountry === f.key
                        ? "bg-primary-brand text-white border-primary-brand shadow-lg shadow-primary-brand/20"
                        : "bg-surface-elevated border-border-brand text-text-secondary hover:border-primary-brand/50 hover:bg-surface-brand"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Story Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-surface-elevated shadow-sm" />
                  <div className="space-y-2 mt-2">
                    <Skeleton className="h-4 w-4/5 bg-surface-elevated" />
                    <Skeleton className="h-3 w-1/2 bg-surface-elevated opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length > 0 ? (
            <motion.div
              key={activeTab + selectedStatus + selectedCountry}
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
            <div className="flex flex-col items-center justify-center py-32 text-center bg-surface-brand/50 border border-dashed border-border-brand rounded-3xl">
              <div className="p-6 rounded-full bg-surface-elevated text-text-muted mb-6 opacity-20">
                < Award size={60} />
              </div>
              <p className="text-text-muted font-bold text-lg">Không tìm thấy truyện nào.</p>
              <p className="text-text-muted text-sm mt-1">Hãy thử thay đổi điều kiện lọc.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
