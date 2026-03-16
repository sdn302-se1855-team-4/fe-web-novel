import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
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

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop";

function formatTimeAgo(date?: string | Date) {
  if (!date) return "Mới đây";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const distance = formatDistanceToNow(d, { locale: vi });
    // distance is something like "19 giờ", "2 ngày"
    // We want "19 Giờ Trước" or "2 Ngày Trước"
    const words = distance.replace("khoảng ", "").split(" ");
    const formattedDistance = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `${formattedDistance} Trước`;
  } catch (e) {
    return "Vừa cập nhật";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "NOVEL":
      return "Novel";
    case "MANGA":
      return "Manga";
    case "COMIC":
      return "Comic";
    default:
      return "LN";
  }
}

export default function StoryCard({ story }: { story: Story }) {
  if (!story) return null;

  const authorName =
    story.author?.displayName ||
    story.author?.username ||
    story.author?.name ||
    "Unknown";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_COVER) target.src = DEFAULT_COVER;
  };

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
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-elevated">
            <BookOpen size={32} strokeWidth={1} />
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <Badge className="bg-black/60 backdrop-blur-md text-white border-none rounded-lg px-2 py-1 text-[10px] font-bold group-hover:bg-emerald-500 transition-colors">
            {formatTimeAgo(story.updatedAt)}
          </Badge>
          {hot && (
            <Badge className="bg-rose-500 text-white border-none rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider animate-pulse">
              Hot
            </Badge>
          )}
        </div>


        {/* Subtle Rating overlay if needed */}
        {story.rating !== undefined && story.rating > 0 && (
          <>
            <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] text-amber-500 font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              <Star size={10} fill="currentColor" />
              {story.rating.toFixed(1)}
            </div>
            <div className="bg-emerald-500/90 backdrop-blur-sm text-[10px] font-black text-white px-2 py-0.5 rounded-md">
              {story.status === "COMPLETED" ? "Full" : "New"}
            </div>
          </>
        )}
      </div>

      {/* Info Content */}
      <div className="mt-3 px-1">
        <h3 className="text-sm sm:text-base font-bold text-text-primary leading-tight line-clamp-3 min-h-[3.75rem] group-hover:text-emerald-500 transition-colors duration-300">
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
