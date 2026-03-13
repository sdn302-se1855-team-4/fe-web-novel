import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  _count?: { chapters: number };
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop";

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

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group relative block cursor-pointer"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[#1e293b] rounded-2xl border border-white/5 group-hover:border-[#10b981]/30 transition-all duration-300">
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
          <div className="w-full h-full flex items-center justify-center text-[#334155]">
            <BookOpen size={32} strokeWidth={1} />
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                        opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Badges */}
        {story.type && (
          <Badge
            variant="emerald"
            className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider
                       px-2 py-0.5 shadow-lg shadow-black/20"
          >
            {typeLabel(story.type)}
          </Badge>
        )}
        {story.status === "COMPLETED" && (
          <Badge
            variant="amber"
            className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider
                       px-2 py-0.5 shadow-lg shadow-black/20"
          >
            Full
          </Badge>
        )}

        {/* Rating overlay at bottom */}
        {story.rating !== undefined && story.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-[#f59e0b]">
            <Star size={10} fill="currentColor" />
            {story.rating.toFixed(1)}
          </div>
        )}

        {/* Chapters count */}
        {story._count?.chapters !== undefined && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-[#94a3b8]">
            <BookOpen size={10} />
            {story._count.chapters}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-2">
        <h3
          className="text-sm font-semibold text-[#f8fafc] leading-snug line-clamp-2
                     group-hover:text-[#10b981] transition-colors duration-200"
        >
          {story.title}
        </h3>
        {story.author && (
          <p
            className="text-xs text-[#64748b] mt-0.5 truncate hover:text-[#94a3b8]
                       transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/users/${story.author!.id}`;
            }}
            title={`Xem hồ sơ ${authorName}`}
          >
            {authorName}
          </p>
        )}

        {/* Genres */}
        {story.genres && story.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {story.genres.slice(0, 2).map((g) => (
              <Badge
                key={g.id}
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-[#1e293b] text-[#64748b] 
                           border border-white/5 rounded-full"
              >
                {g.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
