import Link from "next/link";
import { Star, BookOpen, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Story {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  coverImage?: string;
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
  updatedAt?: string | Date;
  _count?: { chapters: number };
}



function formatTimeAgo(date?: string | Date) {
  if (!date) return "Mới đây";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const distance = formatDistanceToNow(d, { locale: vi });
    // distance is something like "19 giờ", "2 ngày"
    // We want "19 Giờ Trước" or "2 Ngày Trước"
    return `${distance} Trước`;
  } catch {
    return "Vừa cập nhật";
  }
}



export default function StoryCard({ story }: { story: Story }) {
  if (!story) return null;





  // Logic for HOT badge: Updated in last 24h and has view count > threshold
  const isHot = () => {
    if (!story.updatedAt) return false;
    const updatedAt = new Date(story.updatedAt);
    const now = new Date();
    const hoursSinceUpdate =
      (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24 && (story.viewCount || 0) > 100;
  };

  const hot = isHot();

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group relative block cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-surface-elevated ring-1 ring-border-brand/40 group-hover:ring-primary-brand/30 transition-all duration-500 shadow-sm group-hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)]">
        {story.coverImage ? (
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-elevated">
            <BookOpen size={32} strokeWidth={1} />
          </div>
        )}

        {/* Status Badges Overlay (Top Left) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {(story.status === "COMPLETED" || !story.status) && (
            <Badge className={cn(
              "border-none rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight shadow-lg",
              story.status === "COMPLETED" 
                ? "bg-blue-600/90 text-white" 
                : "bg-emerald-500/90 text-white"
            )}>
              {story.status === "COMPLETED" ? "Full" : "New"}
            </Badge>
          )}
          {hot && (
            <Badge className="bg-rose-500/90 text-white border-none rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight shadow-lg animate-pulse">
              Hot
            </Badge>
          )}
        </div>

        {/* Time Ago Overlay (Top Right) */}
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-black/40 backdrop-blur-md text-white/90 px-2 py-0.5 rounded-md text-[9px] font-bold ring-1 ring-white/10 shadow-sm">
            {formatTimeAgo(story.updatedAt)}
          </div>
        </div>

        {/* Bottom Stats Overlay */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between z-20">
          {story.rating !== undefined && story.rating > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] text-amber-500 font-black ring-1 ring-white/10">
              <Star size={10} fill="currentColor" />
              {story.rating.toFixed(1)}
            </div>
          )}
          {story.viewCount !== undefined && story.viewCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] text-emerald-400 font-black ring-1 ring-white/10">
              <Eye size={10} />
              {Intl.NumberFormat("vi", { notation: "compact" }).format(story.viewCount)}
            </div>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="mt-3 px-1">
        <h3 className="text-sm sm:text-base font-bold text-text-primary leading-tight line-clamp-3 min-h-10 group-hover:text-emerald-500 transition-colors duration-300">
          {story.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Chương {story._count?.chapters || 0}
          </span>
          <span className="text-[10px] font-medium text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
            {story.genres?.[0]?.name || "Novel"}
          </span>
        </div>
      </div>
    </Link>
  );
}
