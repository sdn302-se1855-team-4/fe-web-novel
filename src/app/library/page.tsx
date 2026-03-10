"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import StoryCard from "@/components/StoryCard";
import styles from "./library.module.css";

interface StoryItem {
  id: string;
  title: string;
  coverImage?: string;
  type?: string;
  status?: string;
  rating?: number;
  author?: {
    id: string;
    name: string;
    displayName?: string;
    username?: string;
  };
  genres?: { id: string; name: string }[];
  _count?: { chapters: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStories(raw: any): StoryItem[] {
  // Backend may return: { data: [...stories] } or [...stories] or { data: [...bookmarks with story] }
  let list: unknown[];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw?.data && Array.isArray(raw.data)) {
    list = raw.data;
  } else {
    return [];
  }

  return list
    .map((item: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = item as any;
      // If item has a .story property, use it (bookmark object format)
      const story = obj?.story || obj;
      if (!story?.id || !story?.title) return null;

      // Normalize author
      const author = story.author
        ? {
            id: story.author.id,
            name:
              story.author.name ||
              story.author.displayName ||
              story.author.username ||
              "Unknown",
          }
        : undefined;

      // Normalize genres (may be { genre: {...} } or { id, name })
      const genres = story.genres
        ? story.genres.map(
            (g: {
              genre?: { id: string; name: string };
              id?: string;
              name?: string;
            }) => (g.genre ? g.genre : g),
          )
        : undefined;

      return {
        ...story,
        author,
        genres,
      };
    })
    .filter(Boolean) as StoryItem[];
}

export default function LibraryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    apiFetch("/bookmarks")
      .then((res) => {
        setStories(normalizeStories(res));
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">
            <Library size={24} /> Thư viện của tôi
          </h1>
          <p className="text-secondary">Các truyện bạn đã lưu để đọc</p>
        </div>

        {loading ? (
          <div className="grid-stories">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="skeleton" style={{ aspectRatio: "3/4" }} />
                <div
                  style={{
                    padding: "var(--spacing-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 16, width: "80%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 12, width: "50%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="grid-stories">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <BookOpen size={48} />
            <h3>Thư viện trống</h3>
            <p>
              Hãy duyệt truyện và bấm &quot;Lưu truyện&quot; để thêm vào thư
              viện.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
