"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BarChart3, TrendingUp, Users, BookOpen, Coins, ChevronLeft } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface AnalyticsData {
  totalViews: number;
  totalFollowers: number;
  totalStories: number;
  totalEarnings: number;
  stories: AnalyticsStory[];
}

interface AnalyticsStory {
  id: string;
  title: string;
  viewCount: number;
  totalEarnings?: number;
  _count?: {
    chapters: number;
  };
}

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    Promise.all([
      apiFetch<AnalyticsStory[] | { data: AnalyticsStory[] }>("/stories/my").catch(() => []),
      apiFetch<{ totalEarned: number }>("/wallet").catch(() => null)
    ])
      .then(([storiesRes, walletRes]) => {
        const storiesList = Array.isArray(storiesRes)
          ? storiesRes
          : (storiesRes as { data: AnalyticsStory[] }).data || [];
          
        const totalViews = storiesList.reduce(
          (acc, s) => acc + (s.viewCount || 0),
          0,
        );
        
        const actualEarnings = walletRes ? walletRes.totalEarned : 0;
        const mockFollowers = Math.floor(totalViews * 0.15);

        setData({
          totalViews,
          totalFollowers: mockFollowers,
          totalStories: storiesList.length,
          totalEarnings: actualEarnings,
          stories: storiesList.sort(
            (a, b) => (b.viewCount || 0) - (a.viewCount || 0),
          ),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen pt-4">
        <div className="mb-8">
          <div className="w-24 h-6 skeleton rounded-lg" />
        </div>
        <div className="w-64 h-10 skeleton rounded-lg mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-[2rem]" />)}
        </div>
        <div className="h-[400px] skeleton rounded-[2.5rem]" />
      </div>
    );
  }

  if (!data) return null;

  const maxViews = Math.max(...data.stories.map((s) => s.viewCount || 0), 10);

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8">
        <button 
          onClick={() => router.push("/studio")}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
      >
        <h1 className="flex items-center gap-4 text-3xl font-black text-text-primary italic uppercase tracking-tighter">
          <BarChart3 size={32} className="text-emerald-500" /> Thống kê Tác giả
        </h1>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="p-6 sm:p-8 bg-surface-brand border border-border-brand rounded-[2rem] flex items-center gap-6 group hover:bg-surface-elevated transition-colors shadow-lg shadow-black/5"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Tổng lượt đọc</p>
            <h2 className="text-3xl font-black text-text-primary italic tracking-tight">
              {Intl.NumberFormat("vi").format(data.totalViews)}
            </h2>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="p-6 sm:p-8 bg-surface-brand border border-border-brand rounded-[2rem] flex items-center gap-6 group hover:bg-surface-elevated transition-colors shadow-lg shadow-black/5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Users size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Người theo dõi</p>
            <h2 className="text-3xl font-black text-text-primary italic tracking-tight">
              {Intl.NumberFormat("vi").format(data.totalFollowers)}
            </h2>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3 }}
           className="p-6 sm:p-8 bg-surface-brand border border-border-brand rounded-[2rem] flex items-center gap-6 group hover:bg-surface-elevated transition-colors shadow-lg shadow-black/5 sm:col-span-2 lg:col-span-1"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Coins size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Doanh thu dự kiến</p>
            <h2 className="text-3xl font-black text-text-primary italic tracking-tight flex items-center gap-2">
              {Intl.NumberFormat("vi").format(data.totalEarnings)} <span className="text-sm not-italic font-bold text-text-muted uppercase tracking-widest">Xu</span>
            </h2>
          </div>
        </motion.div>
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight italic mb-6 flex items-center gap-3">
           <div className="w-2 h-8 bg-emerald-500 rounded-full" />
           Hiệu suất tác phẩm
        </h2>
        <div className="bg-surface-brand border border-border-brand rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-black/5 overflow-hidden relative">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />

          {data.stories.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
               <BookOpen size={48} className="text-text-muted opacity-20" />
               <p className="text-text-muted font-bold text-lg">Bạn chưa có truyện nào để thống kê.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {data.stories.slice(0, 5).map((story, idx) => {
                const percentage = ((story.viewCount || 0) / maxViews) * 100;
                return (
                  <motion.div 
                    key={story.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-emerald-500 border border-border-brand transition-colors group-hover:border-emerald-500/30">
                          <BookOpen size={20} />
                        </div>
                        <span className="text-lg font-black text-text-primary group-hover:text-emerald-500 transition-colors uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">
                          {story.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 self-end sm:self-auto">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-text-muted uppercase tracking-widest">Lượt đọc</span>
                          <span className="text-xl font-black text-text-primary">{Intl.NumberFormat("vi").format(story.viewCount || 0)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-text-muted uppercase tracking-widest">Doanh thu</span>
                          <span className="text-xl font-black text-emerald-500">{Intl.NumberFormat("vi").format(story.totalEarnings || 0)} xu</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-surface-elevated/50 rounded-full overflow-hidden border border-border-brand/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "circOut", delay: 0.8 + idx * 0.1 }}
                        className="h-full bg-linear-to-r from-emerald-600 to-emerald-400 rounded-full relative"
                      >
                         <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
