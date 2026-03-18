"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, RefreshCw, ChevronLeft, Upload, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { cn, removeAccents } from "@/lib/utils";
import { useToast } from "@/components/Toast";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("NOVEL");
  const [coverImage, setCoverImage] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleRandomCover = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setCoverImage(`https://picsum.photos/seed/${randomId}/400/600`);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch<{ url: string }>("/upload/image", {
        method: "POST",
        body: formData,
      });
      setCoverImage(res.url);
      showToast("Tải ảnh lên thành công", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Tải ảnh thất bại", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    Promise.all([
      apiFetch<Genre[]>("/stories/genres"),
      apiFetch<Tag[]>("/stories/tags"),
    ])
      .then(([g, t]) => {
        setGenres(g);
        setTags(t);
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const slug = removeAccents(title.toLowerCase())
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
          tagIds: selectedTags,
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
        : [...prev, id],
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id],
    );
  };

  return (
    <div className="pb-20 max-w-[850px] mx-auto min-h-screen">
      <div className="mb-8">
        <button 
          onClick={() => router.push("/studio")}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại
        </button>
      </div>

      <h1 className="text-3xl font-black text-text-primary italic uppercase tracking-tighter mb-10 flex items-center gap-4">
        <Plus size={32} className="text-emerald-500" /> Khởi tạo tác phẩm mới
      </h1>

      <div className="p-8 sm:p-12 bg-surface-brand border border-border-brand/50 rounded-[2.5rem] shadow-2xl shadow-black/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-8 relative">
          {error && (
            <div
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2"
            >
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">
                Tiêu đề truyện <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                id="title"
                className="input h-14 rounded-2xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="VD: Hành Trình Của Kẻ Vô Thân"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">
                Mô tả cốt truyện
              </label>
              <textarea
                id="description"
                className="input min-h-[160px] py-4 rounded-2xl resize-none leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Viết vài dòng giới thiệu về tác phẩm của bạn..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="type" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">
                  Định dạng tác phẩm
                </label>
                <div className="relative">
                  <select
                    id="type"
                    className="input h-14 appearance-none rounded-2xl pr-10"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="NOVEL">Novel (Tiểu thuyết)</option>
                    <option value="MANGA">Manga (Truyện tranh Nhật)</option>
                    <option value="COMIC">Comic (Truyện tranh Âu Mỹ)</option>
                    <option value="LIGHTNOVEL">Light Novel</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label
                  htmlFor="coverImage"
                  className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex justify-between items-center"
                >
                  <span>Ảnh bìa tác phẩm</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className="text-[10px] font-black uppercase text-text-muted hover:text-emerald-500 flex items-center gap-1 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                      Tải ảnh lên
                    </button>
                    <button
                      type="button"
                      className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      onClick={handleRandomCover}
                    >
                      <RefreshCw size={12} /> Ngẫu nhiên
                    </button>
                  </div>
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadImage}
                />

                <div className="flex gap-4">
                  <div className="w-24 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-border-brand/50 bg-surface-elevated flex items-center justify-center shrink-0 shadow-xl group relative">
                    {coverImage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImage}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <ImageIcon size={24} className="text-white/70" />
                        </div>
                      </>
                    ) : (
                      <ImageIcon size={32} className="text-text-muted/30" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3 pt-1">
                    <input
                      id="coverImage"
                      className="input h-14 rounded-2xl text-sm"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="Hoặc dán link ảnh tại đây (https://...)"
                      type="url"
                    />
                    <p className="text-[10px] font-bold text-text-muted px-2">
                       Bạn có thể tải ảnh lên từ máy tính hoặc dán trực tiếp đường dẫn URL ảnh.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {genres.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border-brand/30">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Thể loại</label>
                <div className="flex flex-wrap gap-2.5">
                  {genres.map((g) => {
                    const isActive = selectedGenres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 transform active:scale-95 border-2",
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

            {tags.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border-brand/30">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Từ khóa (Tags)</label>
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((t) => {
                    const isActive = selectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 transform active:scale-95 border-2",
                          isActive 
                            ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                            : "bg-surface-elevated border-border-brand text-text-muted hover:border-indigo-500/30 hover:text-indigo-500"
                        )}
                        onClick={() => toggleTag(t.id)}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full h-18 text-xl uppercase tracking-widest font-black italic shadow-2xl shadow-emerald-500/20 mt-10 active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? (
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center gap-4">
                <BookOpen size={24} className="group-hover:rotate-3 transition-transform" /> 
                Khởi tạo tác phẩm ngay
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
