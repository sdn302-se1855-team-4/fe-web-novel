"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

interface Genre {
  id: string;
  name: string;
}
interface Tag {
  id: string;
  name: string;
}

export default function CreateStoryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("NOVEL");
  const [coverImage, setCoverImage] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRandomCover = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setCoverImage(`https://picsum.photos/seed/${randomId}/400/600`);
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    Promise.all([
      apiFetch<Genre[]>("/stories/genres"),
      apiFetch<Tag[]>("/stories/tags"),
    ])
      .then(([g]) => {
        setGenres(g);
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      await apiFetch("/stories", {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          description,
          type,
          coverImage: coverImage || undefined,
          genreIds: selectedGenres,
        }),
      });
      router.push("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo truyện thất bại");
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres((prev) =>
      prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 className="section-title">
          <Plus size={24} /> Tạo truyện mới
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          {error && (
            <div
              style={{
                background: "hsl(0,80%,95%)",
                color: "var(--color-error)",
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="label">
              Tiêu đề truyện *
            </label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Nhập tiêu đề truyện"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="label">
              Mô tả
            </label>
            <textarea
              id="description"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung truyện..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="type" className="label">
              Loại truyện
            </label>
            <select
              id="type"
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="NOVEL">Novel</option>
              <option value="MANGA">Manga</option>
              <option value="COMIC">Comic</option>
              <option value="LIGHTNOVEL">Light Novel</option>
            </select>
          </div>

          <div className="form-group">
            <label
              htmlFor="coverImage"
              className="label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Link ảnh bìa</span>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={handleRandomCover}
                style={{ fontSize: "0.7rem", color: "var(--color-primary)" }}
              >
                <RefreshCw size={12} /> Ngẫu nhiên
              </button>
            </label>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <input
                id="coverImage"
                className="input"
                style={{ flex: 1 }}
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                type="url"
              />
              {coverImage && (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {genres.length > 0 && (
            <div className="form-group">
              <label className="label">Thể loại (tối đa 5)</label>
              <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                {genres.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`btn btn-sm ${selectedGenres.includes(g.id) ? "btn-primary" : "btn-outline"}`}
                    onClick={() => toggleGenre(g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: "var(--spacing-md)" }}
          >
            {loading ? (
              "Đang tạo..."
            ) : (
              <>
                <BookOpen size={18} /> Tạo truyện
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
