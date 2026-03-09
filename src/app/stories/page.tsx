"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import StoryCard from "@/components/StoryCard";
import styles from "./stories.module.css";

interface Story {
  id: string;
  title: string;
  coverImage?: string;
  type?: string;
  status?: string;
  viewCount?: number;
  averageRating?: number;
  author?: { id: string; name: string };
  genres?: { id: string; name: string }[];
  _count?: { chapters: number };
}

interface Genre {
  id: string;
  name: string;
}

function StoriesContent() {
  const searchParams = useSearchParams();

  const [stories, setStories] = useState<Story[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedGenre, setSelectedGenre] = useState(
    searchParams.get("genre") || "",
  );
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "",
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    apiFetch<Genre[]>("/stories/genres")
      .then(setGenres)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedGenre) params.set("genre", selectedGenre);
      if (selectedType) params.set("type", selectedType);
      if (selectedStatus) params.set("status", selectedStatus);
      params.set("page", String(page));
      params.set("limit", "12");

      apiFetch<{ data: Story[]; totalPages?: number } | Story[]>(
        `/stories?${params.toString()}`,
      )
        .then((res) => {
          if (Array.isArray(res)) {
            setStories(res);
          } else {
            setStories(res.data || []);
            if (res.totalPages) setTotalPages(res.totalPages);
          }
        })
        .catch(() => setStories([]))
        .finally(() => setLoading(false));
    };
    fetchStories();
  }, [search, selectedGenre, selectedType, selectedStatus, page]);

  const clearFilters = () => {
    setSearch("");
    setSelectedGenre("");
    setSelectedType("");
    setSelectedStatus("");
    setPage(1);
  };

  const hasFilters = search || selectedGenre || selectedType || selectedStatus;

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className="section-title">Duyệt truyện</h1>

        {/* Search & Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={`input ${styles.searchInput}`}
              placeholder="Tìm kiếm truyện..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className={styles.filterRow}>
            <select
              className={`input ${styles.selectFilter}`}
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả thể loại</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              className={`input ${styles.selectFilter}`}
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả loại</option>
              <option value="NOVEL">Novel</option>
              <option value="MANGA">Manga</option>
              <option value="COMIC">Comic</option>
              <option value="LIGHTNOVEL">Light Novel</option>
            </select>

            <select
              className={`input ${styles.selectFilter}`}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ONGOING">Đang ra</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="HIATUS">Tạm dừng</option>
            </select>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={16} /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Story Grid */}
        {loading ? (
          <div className="grid-stories">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonCover}`} />
                <div className={styles.skeletonInfo}>
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
          <>
            <div className="grid-stories">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trang trước
                </button>
                <span className={styles.pageInfo}>
                  Trang {page} / {totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <Filter size={48} />
            <p>Không tìm thấy truyện nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <StoriesContent />
    </Suspense>
  );
}
