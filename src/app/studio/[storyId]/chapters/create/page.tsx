"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, BookOpen, ChevronLeft, LayoutPanelTop, Coins, FileText, Sparkles, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;

  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [content, setContent] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
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

      const parsedChapterNumber = parseInt(chapterNumber, 10);
      if (!parsedChapterNumber || parsedChapterNumber < 1) {
        throw new Error("Số chương không hợp lệ. Vui lòng nhập số lớn hơn hoặc bằng 1.");
      }

      const parsedPrice = parseInt(price, 10);
      if (isPremium) {
        if (!parsedPrice || parsedPrice < 0) {
          throw new Error("Giá chương không hợp lệ. Vui lòng nhập số lớn hơn hoặc bằng 0.");
        }
      }

      await apiFetch(`/stories/${storyId}/chapters`, {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          chapterNumber: parsedChapterNumber,
          content,
          isPremium,
          price: isPremium ? parsedPrice : 0,
        }),
      });
      router.push(`/studio/${storyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo chương thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại tác phẩm
        </button>
      </div>

      <div className="max-w-[900px] mx-auto">
        <h1 className="text-3xl font-black text-text-primary italic uppercase tracking-tighter mb-10 flex items-center gap-4">
          <Plus size={32} className="text-emerald-500" /> Thêm chương mới
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="bg-surface-brand border border-border-brand/50 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-black/5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
             
             <div className="space-y-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3 space-y-2">
                    <label htmlFor="title" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                      <FileText size={14} className="text-emerald-500" /> Tiêu đề chương
                    </label>
                    <input
                      id="title"
                      className="input h-14 rounded-2xl"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="VD: Khởi đầu mới..."
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <label htmlFor="chapterNumber" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                      <LayoutPanelTop size={14} className="text-blue-500" /> Số chương
                    </label>
                    <input
                      id="chapterNumber"
                      type="number"
                      min="1"
                      className="input h-14 rounded-2xl text-center font-bold"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label htmlFor="content" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-500" /> Nội dung chương
                  </label>
                  <textarea
                    id="content"
                    className="input min-h-[400px] py-4 rounded-2xl resize-none leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    placeholder="Bắt đầu viết nội dung chương tại đây..."
                  />
                </div>

                <div className={cn(
                  "p-6 rounded-3xl border-2 transition-all duration-300 space-y-4",
                  isPremium 
                    ? "bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5" 
                    : "bg-surface-elevated/50 border-border-brand/40"
                )}>
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isPremium}
                        onChange={(e) => setIsPremium(e.target.checked)}
                        className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-surface-elevated border-2 border-border-brand transition-colors checked:bg-amber-500 checked:border-amber-500"
                      />
                      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-text-muted transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
                    </div>
                    <span className={cn(
                      "text-sm font-black uppercase tracking-wider transition-colors",
                      isPremium ? "text-amber-500" : "text-text-muted group-hover:text-text-primary"
                    )}>
                      Thiết lập chương Premium (Trả phí)
                    </span>
                  </label>

                  {isPremium && (
                    <div className="space-y-4 pt-2">
                       <label htmlFor="price" className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                         <Coins size={14} className="text-amber-500" /> Giá chương (Số xu)
                       </label>
                       <div className="relative">
                         <input
                           id="price"
                           type="number"
                           min="0"
                           className="input h-14 rounded-2xl pl-12"
                           value={price}
                           onChange={(e) => setPrice(e.target.value)}
                           required={isPremium}
                           placeholder="VD: 50"
                         />
                         <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                       </div>
                       <p className="text-[11px] font-medium text-text-muted ml-1 flex items-center gap-1.5">
                         <Info size={12} /> Người đọc cần trả số xu này để mở khóa nội dung.
                       </p>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full h-18 text-xl uppercase tracking-widest font-black italic shadow-2xl shadow-emerald-500/20 mt-8" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-4">
                      <BookOpen size={24} className="group-hover:rotate-6 transition-transform" /> 
                      Xuất bản chương truyện
                    </div>
                  )}
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}
