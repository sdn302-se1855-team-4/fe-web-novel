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
    const formattedDistance = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return `${formattedDistance} Trước`;
  } catch (e) {
    return "Vừa cập nhật";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "NOVEL": return "Novel";
    case "MANGA": return "Manga";
    case "COMIC": return "Comic";
    default: return "LN";
  }
}

export default function StoryCard({ story }: { story: Story }) {
  if (!story) return null;

  const authorName =
    story.author?.displayName ||
    story.author?.username ||
    story.author?.name ||
    "Unknown";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_COVER) target.src = DEFAULT_COVER;
  };

  // Logic for HOT badge: Updated in last 24h and has view count > threshold
  const isHot = () => {
    if (!story.updatedAt) return false;
    const updatedAt = new Date(story.updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24 && (story.viewCount || 0) > 100;
  };

  const hot = isHot();

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group relative block cursor-pointer"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-elevated/80 rounded-2xl border border-border-bright group-hover:border-primary-brand/30 transition-all duration-300 shadow-sm group-hover:shadow-md">
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 
                       group-hover:scale-105"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <BookOpen size={32} strokeWidth={1} />
          </div>
        )}

        {/* Dark overlay gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Left Badges - Grouped together as per image */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <Badge
            className="bg-[#5bc0de] hover:bg-[#5bc0de] text-white text-[10px] font-bold border-none rounded-lg px-2 py-1 shadow-md whitespace-nowrap"
          >
            {formatTimeAgo(story.updatedAt)}
          </Badge>
          
          {hot && (
            <Badge
              className="bg-[#ff3b5c] hover:bg-[#ff3b5c] text-white text-[10px] font-black border-none rounded-lg px-2.5 py-1 shadow-md uppercase tracking-tight"
            >
              Hot
            </Badge>
          )}
        </div>


        {/* Subtle Rating overlay if needed */}
        {story.rating !== undefined && story.rating > 0 && (
          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] text-amber-500 font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <Star size={10} fill="currentColor" />
            {story.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info - Center Aligned as per image */}
      <div className="pt-3 text-center">
        <h3
          className="text-base font-bold text-text-primary leading-tight line-clamp-2
                     group-hover:text-primary-brand transition-colors duration-200"
        >
          {story.title}
        </h3>
        <p className="text-xs font-bold text-text-primary/80 mt-1 uppercase tracking-wide">
          Chương {story._count?.chapters || 0}
        </p>
      </div>
    </Link>
  );
}
