import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import styles from "./StoryCard.module.css";

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
    if (target.src !== DEFAULT_COVER) {
      target.src = DEFAULT_COVER;
    }
  };

  return (
    <Link href={`/stories/${story.id}`} className={styles.card}>
      <div className={styles.coverWrapper}>
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt={story.title}
            className={styles.cover}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            <BookOpen size={32} />
          </div>
        )}
        {story.type && (
          <span className={styles.typeBadge}>
            {story.type === "NOVEL"
              ? "Novel"
              : story.type === "MANGA"
                ? "Manga"
                : story.type === "COMIC"
                  ? "Comic"
                  : "LN"}
          </span>
        )}
        {story.status === "COMPLETED" && (
          <span className={styles.completedBadge}>Hoàn thành</span>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{story.title}</h3>
        {story.author && (
          <p
            className={styles.author}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/users/${story.author!.id}`;
            }}
            style={{ cursor: "pointer" }}
            title={`Xem hồ sơ ${authorName}`}
          >
            {authorName}
          </p>
        )}
        <div className={styles.meta}>
          {story.rating !== undefined && story.rating > 0 && (
            <span className={styles.rating}>
              <Star size={14} fill="currentColor" />
              {story.rating.toFixed(1)}
            </span>
          )}
          {story._count?.chapters !== undefined && (
            <span className={styles.chapters}>
              <BookOpen size={14} />
              {story._count.chapters} ch.
            </span>
          )}
        </div>
        {story.genres && story.genres.length > 0 && (
          <div className={styles.genres}>
            {story.genres.slice(0, 2).map((g) => (
              <span key={g.id} className={styles.genre}>
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
