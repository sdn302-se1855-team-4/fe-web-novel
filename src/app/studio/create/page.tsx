"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, RefreshCw, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
    <div className="pb-12" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại
        </button>
      </div>

      <h1 className="section-title text-4xl italic tracking-tighter uppercase font-black">
        <Plus size={32} className="text-emerald-500" /> Tạo truyện mới
      </h1>

      <div className="p-8 bg-surface-brand border border-border-brand rounded-[2.5rem] shadow-2xl shadow-emerald-500/5">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label htmlFor="title" className="label">
                Tiêu đề truyện <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                id="title"
                className="input h-14"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="VD: Hành Trình Của Kẻ Vô Thân"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="label">
                Mô tả cốt truyện
              </label>
              <textarea
                id="description"
                className="input min-h-[160px] py-4 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Viết vài dòng giới thiệu về tác phẩm của bạn..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="type" className="label">
                  Định dạng tác phẩm
                </label>
                <select
                  id="type"
                  className="input h-14 appearance-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="NOVEL">Novel</option>
                  <option value="MANGA">Manga</option>
                  <option value="COMIC">Comic</option>
                  <option value="LIGHTNOVEL">Light Novel</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="coverImage"
                  className="label flex justify-between items-center"
                >
                  <span>Ảnh bìa tác phẩm</span>
                  <button
                    type="button"
                    className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    onClick={handleRandomCover}
                  >
                    <RefreshCw size={12} /> Lấy ảnh ngẫu nhiên
                  </button>
                </label>
                <div className="flex gap-3">
                  <input
                    id="coverImage"
                    className="input h-14 flex-1"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="Dán link ảnh tại đây (https://...)"
                    type="url"
                  />
                  {coverImage && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-border-brand bg-surface-elevated shrink-0 shadow-lg shadow-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {genres.length > 0 && (
              <div className="space-y-4">
                <label className="label">Thể loại</label>
                <div className="flex flex-wrap gap-3">
                  {genres.map((g) => {
                    const isActive = selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={cn(
                          "px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 transform active:scale-95 border-2",
                          isActive 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : "bg-surface-elevated border-border-brand text-text-muted hover:border-emerald-500/30 hover:text-emerald-500"
                        )}
                        onClick={() => toggleGenre(g.id)}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full h-16 text-xl uppercase tracking-widest font-black italic mt-10"
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center gap-3">
                <BookOpen size={24} /> Khởi tạo tác phẩm
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
