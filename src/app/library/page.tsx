"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import StoryCard from "@/components/StoryCard";

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
    <div className="page-wrapper min-h-screen">
      <div className="container py-8 sm:py-12">
        <div className="mb-10 group">
          <h1 className="flex items-center gap-3 text-3xl font-black text-text-primary italic uppercase tracking-tight group-hover:text-emerald-500 transition-colors">
            <Library size={28} className="text-emerald-500" /> Thư viện của tôi
          </h1>
          <p className="text-text-muted mt-2 font-medium">Các truyện bạn đã lưu để đọc</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-border-brand bg-surface-brand shadow-sm"
              >
                <div className="skeleton aspect-3/4" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="skeleton h-5 w-[80%]" />
                  <div className="skeleton h-4 w-[50%]" />
                </div>
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-text-muted text-center max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center">
              <BookOpen size={48} className="text-emerald-500/50" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-primary mb-2 uppercase tracking-tight">Thư viện trống</h3>
              <p className="font-medium">
                Hãy duyệt truyện và bấm &quot;Lưu truyện&quot; để thêm vào thư viện của bạn.
              </p>
            </div>
            <button 
              onClick={() => router.push("/stories")}
              className="btn btn-primary px-8 mt-2"
            >
              Khám phá truyện ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
