"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

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
    <div className="page-wrapper bg-bg-brand pb-20 overflow-x-hidden min-h-screen">
      {/* decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-2 tracking-tight pt-12">
            Thư viện <span className="text-emerald-500">của tôi</span>
          </h1>
          <p className="text-text-muted font-medium">Các truyện bạn đã lưu để đọc</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-10"
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-brand/50 border border-border-brand/50 rounded-2xl overflow-hidden aspect-2/3.5 animate-pulse"
                >
                  <div className="w-full aspect-2/3 bg-surface-elevated/80" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-surface-elevated rounded w-3/4 mx-auto" />
                    <div className="h-3 bg-surface-elevated rounded w-1/2 mx-auto" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : stories.length > 0 ? (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-10"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center text-center py-24 text-text-muted"
          >
            <BookOpen size={48} className="text-text-muted mb-6" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Thư viện trống</h3>
            <p className="max-w-xs mb-8">
              Hãy duyệt truyện và bấm &quot;Lưu truyện&quot; để thêm vào thư viện.
            </p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
