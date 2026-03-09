"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pen, Plus, BookOpen, Eye, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./studio.module.css";

interface Story {
  id: string;
  title: string;
  coverImage?: string;
  type?: string;
  status?: string;
  viewCount?: number;
  _count?: { chapters: number };
  createdAt?: string;
  updatedAt?: string;
}

export default function StudioPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    apiFetch<Story[] | { data: Story[] }>("/stories/my")
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : (res as { data: Story[] }).data || [];
        setStories(list);
      })
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (storyId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa truyện "${title}"?`)) return;
    try {
      await apiFetch(`/stories/${storyId}`, { method: "DELETE" });
      setStories((prev) => prev.filter((s) => s.id !== storyId));
    } catch {
      alert("Xóa truyện thất bại");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">
            <Pen size={24} /> Writer Studio
          </h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/studio/analytics" className="btn btn-outline">
              <BookOpen size={18} /> Thống kê & Doanh thu
            </Link>
            <Link href="/studio/create" className="btn btn-primary">
              <Plus size={18} /> Tạo truyện mới
            </Link>
          </div>
        </div>

        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.storyRow}>
                <div
                  className="skeleton"
                  style={{
                    width: 60,
                    height: 80,
                    borderRadius: "var(--radius-md)",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 20, width: "50%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 14, width: "30%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className={styles.list}>
            {stories.map((story) => (
              <div key={story.id} className={styles.storyRow}>
                <div className={styles.storyCover}>
                  {story.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.coverImage} alt={story.title} />
                  ) : (
                    <BookOpen size={24} />
                  )}
                </div>
                <div className={styles.storyInfo}>
                  <h3 className={styles.storyTitle}>{story.title}</h3>
                  <div className={styles.storyMeta}>
                    <span
                      className={`badge ${story.status === "COMPLETED" ? "badge-success" : story.status === "ONGOING" ? "badge-primary" : "badge-warning"}`}
                    >
                      {story.status === "ONGOING"
                        ? "Đang ra"
                        : story.status === "COMPLETED"
                          ? "Hoàn thành"
                          : "Tạm dừng"}
                    </span>
                    <span className="text-sm text-muted">
                      <Eye size={14} /> {story.viewCount || 0}
                    </span>
                    <span className="text-sm text-muted">
                      <BookOpen size={14} /> {story._count?.chapters || 0}{" "}
                      chương
                    </span>
                  </div>
                </div>
                <div className={styles.storyActions}>
                  <Link
                    href={`/studio/${story.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={14} /> Chỉnh sửa
                  </Link>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(story.id, story.title)}
                    aria-label="Xóa truyện"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Pen size={48} />
            <h3>Chưa có truyện nào</h3>
            <p>Bắt đầu sáng tác truyện đầu tiên của bạn!</p>
            <Link href="/studio/create" className="btn btn-primary">
              <Plus size={18} /> Tạo truyện mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
