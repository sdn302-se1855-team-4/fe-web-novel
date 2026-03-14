"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Star,
  User,
  Eye,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  ChevronRight,
  Crown,
  Heart,
  Gift,
  Clock,
  Share2,
  ChevronLeft,
  ThumbsUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Story {
  id: string;
  title: string;
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
  tags?: { id: string; name: string }[];
  _count?: { chapters: number; comments: number };
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop";

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  isPremium?: boolean;
  createdAt?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
  parentId?: string;
}

interface Review {
  id: string;
  rating: number;
  content?: string;
  createdAt: string;
  user: { id: string; name: string };
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chapters");

  // Donate modal state
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number>(100);
  const [donateMessage, setDonateMessage] = useState("");
  const [donateLoading, setDonateLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      apiFetch<Story>(`/stories/${storyId}`),
      apiFetch<Chapter[]>(`/stories/${storyId}/chapters`),
      apiFetch<{ data: Comment[] } | Comment[]>(`/stories/${storyId}/comments`),
    ])
      .then(([storyData, chaptersData, commentsData]) => {
        setStory(storyData);
        setChapters(Array.isArray(chaptersData) ? chaptersData : []);
        setComments(
          Array.isArray(commentsData)
            ? commentsData
            : (commentsData as { data: Comment[] }).data || [],
        );
      })
      .catch(() => { })
      .finally(() => setLoading(false));

    // Fetch reviews
    apiFetch<{ data: Review[] }>(`/reviews/story/${storyId}`)
      .then((res) => setReviews(res.data || []))
      .catch(() => { });

    // Check bookmark status
    if (isLoggedIn()) {
      apiFetch<{ isBookmarked: boolean }>(`/bookmarks/check/${storyId}`)
        .then((res) =>
          setBookmarked(
            res.isBookmarked || (res as unknown as boolean) === true,
          ),
        )
        .catch(() => { });
    }
  }, [storyId]);

  const handleBookmark = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      if (prev) {
        await apiFetch(`/bookmarks/${storyId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/bookmarks/${storyId}`, { method: "POST" });
      }
    } catch {
      setBookmarked(prev);
    }
  };

  const handleComment = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const comment = await apiFetch<Comment>(`/stories/${storyId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment, parentId: replyTo }),
      });
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      setReplyTo(null);
    } catch {
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (donateAmount <= 0) return;
    setDonateLoading(true);
    try {
      await apiFetch("/wallet/donate", {
        method: "POST",
        body: JSON.stringify({
          toUserId: story?.author?.id,
          storyId,
          amount: donateAmount,
          message: donateMessage,
        }),
      });
      showToast("Ủng hộ thành công! Cảm ơn bạn.", "success");
      setShowDonate(false);
      setDonateMessage("");
    } catch (err) {
      showToast(
        (err as Error).message || "Ủng hộ thất bại. Vui lòng kiểm tra số dư.",
        "error",
      );
    } finally {
      setDonateLoading(false);
    }
  };

  const handleReview = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setReviewLoading(true);
    try {
      const review = await apiFetch<Review>("/reviews", {
        method: "POST",
        body: JSON.stringify({
          storyId,
          rating: newReviewRating,
          content: newReviewContent,
        }),
      });
      setReviews((prev) => [review, ...prev]);
      setNewReviewContent("");
      setNewReviewRating(5);
      setShowReviewDialog(false);
      showToast("Gửi đánh giá thành công!", "success");
    } catch (err) {
      showToast(
        (err as Error).message || "Bạn đã đánh giá bộ truyện này rồi.",
        "error",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // Group comments into threaded format
  const rootComments = comments.filter((c) => !c.parentId);
  const childComments = comments.filter((c) => c.parentId);

  const authorName =
    story?.author?.displayName ||
    story?.author?.username ||
    story?.author?.name ||
    "Unknown";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_COVER) {
      target.src = DEFAULT_COVER;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-brand pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 aspect-[2/3] bg-surface-elevated rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-10 bg-surface-elevated rounded-lg animate-pulse w-2/3" />
              <div className="h-6 bg-surface-elevated rounded-lg animate-pulse w-1/3" />
              <div className="h-32 bg-surface-elevated rounded-lg animate-pulse w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-bg-brand flex items-center justify-center text-text-primary">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy truyện</h2>
          <Button onClick={() => router.push("/")} variant="outline" className="border-border-brand hover:bg-surface-elevated text-text-primary">
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper bg-bg-brand pb-20 overflow-x-hidden -mt-[var(--navbar-height)]">
      {/* Immersive Background Header */}
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
        {story.coverImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-3xl opacity-20 transition-opacity duration-1000"
            style={{ backgroundImage: `url(${story.coverImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-brand/0 via-bg-brand/80 to-bg-brand" />
      </div>

      <div className="container max-w-7xl mx-auto px-6 -mt-20 md:-mt-28 relative z-10">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-xs group"
          >
            <div className="p-1.5 rounded-lg bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
              <ChevronLeft size={14} />
            </div>
            Quay lại trang chủ
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Left Sidebar - Cover Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-56 lg:w-64 shrink-0"
          >
            <div className="relative group rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border-brand aspect-[2/3] bg-surface-elevated">
              {story.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-muted bg-surface-elevated">
                  <BookOpen size={64} className="mb-4 opacity-20" />
                  <span className="text-sm font-medium opacity-40">Không có ảnh bìa</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                onClick={() => setShowDonate(true)}
                className="w-full h-10 border-rose-500/20 bg-surface-elevated text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg gap-1.5 font-bold cursor-pointer text-xs"
              >
                <Heart size={14} fill="currentColor" />
                Ủng hộ tác giả
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 border-border-brand bg-surface-elevated text-text-primary hover:bg-surface-brand transition-all rounded-lg gap-1.5 font-bold cursor-pointer text-xs"
              >
                <Share2 size={14} />
                Chia sẻ truyện
              </Button>
            </div>
          </motion.div>

          {/* Right Content - Info & Tabs */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {story.status && (
                    <Badge className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold tracking-wider",
                      story.status === "COMPLETED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        story.status === "ONGOING" ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30" :
                          "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                    )}>
                      {story.status === "ONGOING" ? "ĐANG RA" :
                        story.status === "COMPLETED" ? "HOÀN THÀNH" : "TẠM DỪNG"}
                    </Badge>
                  )}
                  {story.type && (
                    <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border-border-brand text-text-muted">
                      {story.type}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-text-primary leading-[1.2] tracking-tight">
                  {story.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted font-bold">
                  {story.author?.id ? (
                    <Link href={`/users/${story.author.id}`} className="flex items-center gap-2 hover:text-primary-brand transition-colors group text-sm">
                      <div className="w-7 h-7 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand group-hover:bg-primary-brand group-hover:text-white transition-all shadow-sm">
                        <User size={12} />
                      </div>
                      <span className="text-text-primary">{authorName}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      <User size={14} />
                      {authorName}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Star className="text-accent-brand" size={14} fill="currentColor" />
                    <span className="text-text-primary font-black">{story.rating?.toFixed(1) || "5.0"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Eye size={14} className="text-primary-brand" />
                    <span>{Intl.NumberFormat("vi").format(story.viewCount || 0)} lượt xem</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-secondary-brand" />
                    <span>{story.updatedAt ? new Intl.DateTimeFormat("vi").format(new Date(story.updatedAt)) : "Vừa xong"}</span>
                  </div>
                </div>
              </div>

              {/* Genres Tag Cloud */}
              {story.genres && story.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {story.genres.map((g) => (
                    <Badge
                      key={g.id}
                      variant="secondary"
                      className="bg-white/5 hover:bg-[#10b981]/20 hover:text-[#10b981] text-slate-300 border-white/5 transition-all cursor-pointer rounded-lg px-3 py-1.5"
                    >
                      {g.name}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator className="bg-border-brand" />

              <div className="space-y-3">
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-primary-brand rounded-full shadow-lg shadow-primary-glow" />
                  Cốt truyện
                </h3>
                <p className="text-text-secondary leading-relaxed text-sm md:text-base line-clamp-4 hover:line-clamp-none transition-all duration-500 cursor-pointer italic">
                  {story.description || "Chưa có mô tả cho bộ truyện này."}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {chapters.length > 0 && (
                  <Button
                    onClick={() => router.push(`/stories/${story.id}/chapters/${chapters[0]?.chapterNumber || 1}`)}
                    className="h-10 px-6 bg-[#8ac94e] hover:bg-[#7ab343] text-white font-black rounded-lg gap-2 shadow-md transition-all hover:scale-105 active:scale-95 text-xs border-none"
                  >
                    <BookOpen size={16} />
                    Đọc từ đầu
                  </Button>
                )}

                <Button
                  onClick={handleBookmark}
                  className={cn(
                    "h-10 px-6 font-black rounded-lg gap-2 shadow-md transition-all hover:scale-105 active:scale-95 text-xs border-none",
                    bookmarked
                      ? "bg-primary-brand text-slate-950"
                      : "bg-[#ff3b5c] hover:bg-[#e63250] text-white"
                  )}
                >
                  {bookmarked ? <BookmarkCheck size={16} /> : "Theo dõi"}
                </Button>

                <Button
                  onClick={() => setShowReviewDialog(true)}
                  variant="outline"
                  className="h-10 px-4 border-border-brand bg-surface-elevated text-text-primary hover:bg-surface-brand font-bold rounded-lg gap-2 text-xs"
                >
                  <MessageCircle size={16} />
                  Bình luận
                </Button>
              </div>
            </motion.div>

            {/* Content Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <Tabs defaultValue="chapters" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-surface-elevated p-1 h-auto rounded-xl border border-border-brand backdrop-blur-xl mb-6 flex-wrap justify-start">
                  <TabsTrigger
                    value="chapters"
                    className="rounded-lg px-4 py-2 text-xs data-[state=active]:bg-primary-brand data-[state=active]:text-slate-950 text-text-muted font-black transition-all gap-1.5"
                  >
                    <BookOpen size={14} />
                    CHƯƠNG ({chapters.length})
                  </TabsTrigger>
                </TabsList>

                {/* Chapters Content */}
                <TabsContent value="chapters" className="mt-0 outline-none">
                  <div className="space-y-3">
                    {chapters.length > 0 ? (
                      chapters.map((ch, idx) => (
                        <motion.div
                          key={ch.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * Math.min(idx, 15) }}
                        >
                          <Link
                            href={`/stories/${story.id}/chapters/${ch.chapterNumber}`}
                            className="group block relative p-5 bg-surface-brand/40 border border-border-brand/50 rounded-2xl hover:bg-surface-elevated hover:border-primary-brand/30 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                          >
                            <div className="flex items-center gap-6">
                              {/* Chapter Number Badge */}
                              <div className="w-14 h-14 shrink-0 rounded-2xl bg-surface-elevated border border-border-brand flex flex-col items-center justify-center group-hover:bg-primary-brand group-hover:border-primary-brand transition-all duration-300 shadow-sm relative overflow-hidden">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter group-hover:text-slate-900 leading-none mb-1">CHƯƠNG</span>
                                <span className="text-xl font-black text-text-primary group-hover:text-slate-950 leading-none">{ch.chapterNumber}</span>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>

                              {/* Title and Info section */}
                              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <h4 className="text-base md:text-lg font-black text-text-primary group-hover:text-primary-brand transition-colors truncate">
                                    {ch.title}
                                  </h4>
                                  <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={14} className="text-secondary-brand" />
                                      <span>Cập nhật: {ch.createdAt ? new Intl.DateTimeFormat("vi").format(new Date(ch.createdAt)) : "Vừa xong"}</span>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1.5">
                                      <Eye size={14} className="text-primary-brand" />
                                      <span>Mới</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Actions/Badges */}
                                <div className="flex items-center gap-4 shrink-0">
                                  {ch.isPremium && (
                                    <Badge className="bg-accent-brand/20 text-accent-brand border border-accent-brand/20 gap-1 px-3 py-1 font-black text-[10px]">
                                      <Crown size={12} fill="currentColor" />
                                      PREMIUM
                                    </Badge>
                                  )}
                                  <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                    <span className="text-[10px] font-black text-primary-brand opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest hidden sm:block">ĐỌC NGAY</span>
                                    <div className="w-10 h-10 rounded-full border border-border-brand flex items-center justify-center group-hover:border-primary-brand group-hover:bg-primary-brand transition-all">
                                      <ChevronRight size={18} className="text-text-muted group-hover:text-slate-950" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Visual Glow Effect on Hover */}
                            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </Link>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-32 text-center bg-surface-brand/40 border-2 border-dashed border-border-brand rounded-3xl">
                        <BookOpen size={48} className="mx-auto mb-4 text-text-muted opacity-20" />
                        <h5 className="text-xl font-black text-text-muted">Chưa có chương nào</h5>
                        <p className="text-text-muted/60 font-bold mt-2">Dường như tác giả đang tích cực chuẩn bị nội dung mới!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Community & Reviews Feed */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 space-y-8"
              id="reviews-section"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-text-primary flex items-center gap-3">
                  <div className="w-2 h-6 bg-primary-brand rounded-full shadow-lg shadow-primary-glow" />
                  Cộng đồng & Đánh giá
                  <span className="text-sm font-bold text-text-muted bg-surface-elevated px-3 py-1 rounded-full border border-border-brand ml-2">
                    {reviews.length + comments.length}
                  </span>
                </h3>
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  variant="ghost"
                  className="text-primary-brand hover:text-primary-light font-bold gap-2"
                >
                  <MessageCircle size={18} />
                  Viết đánh giá
                </Button>
              </div>

              <div className="space-y-6">
                {[...reviews.map(r => ({ ...r, type: 'review' })), ...rootComments.map(c => ({ ...c, type: 'comment' }))]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((item: any) => (
                    <div key={item.id} className="group">
                      <div className="bg-surface-brand border border-border-brand p-6 rounded-3xl group-hover:bg-surface-elevated transition-all shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-brand to-secondary-brand flex items-center justify-center text-white font-black text-lg shadow-lg">
                              {(item.user?.name || "A")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-text-primary">{item.user?.name || "Người dùng"}</p>
                                {item.type === 'review' && (
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={10} className={i < item.rating ? "text-accent-brand" : "text-border-brand"} fill={i < item.rating ? "currentColor" : "none"} />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-text-muted font-medium">{new Intl.DateTimeFormat("vi").format(new Date(item.createdAt))}</p>
                            </div>
                          </div>
                          {item.type === 'comment' && (
                            <Button variant="ghost" size="sm" className="text-text-muted hover:text-primary-brand font-bold" onClick={() => setReplyTo(item.id)}>
                              Trả lời
                            </Button>
                          )}
                        </div>
                        <p className="text-text-secondary leading-relaxed pl-15 italic">
                          {item.content}
                        </p>
                      </div>

                      {item.type === 'comment' && (
                        <div className="pl-12 mt-3 space-y-3">
                          {childComments.filter(c => c.parentId === item.id).map(reply => (
                            <div key={reply.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-bold text-sm text-[#10b981]">{reply.user?.name || "Ẩn danh"}</p>
                                <p className="text-[10px] text-slate-600 tracking-tighter uppercase font-bold">• {new Intl.DateTimeFormat("vi").format(new Date(reply.createdAt))}</p>
                              </div>
                              <p className="text-slate-400 text-sm">{reply.content}</p>
                            </div>
                          ))}

                          {replyTo === item.id && (
                            <div className="bg-white/[0.05] border border-[#10b981]/20 p-4 rounded-2xl flex flex-col gap-3">
                              <textarea
                                autoFocus
                                placeholder={`Trả lời ${item.user?.name}...`}
                                className="w-full bg-transparent border-none text-white text-sm focus:ring-0 resize-none"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => setReplyTo(null)}>Hủy</Button>
                                <Button size="sm" className="bg-[#10b981] text-[#020617] font-bold" onClick={handleComment}>Gửi</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                {reviews.length === 0 && rootComments.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <MessageCircle size={40} className="mx-auto mb-4 text-slate-700 opacity-30" />
                    <p className="text-slate-500 font-medium tracking-tight">Trở thành người đầu tiên đánh giá & thảo luận về bộ truyện này!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Donate Dialog (Refined) */}
      <Dialog open={showDonate} onOpenChange={setShowDonate}>
        <DialogContent className="bg-surface-brand/95 backdrop-blur-3xl border-border-brand text-text-primary rounded-[2rem] max-w-md w-[95%] shadow-2xl">
          <DialogHeader className="items-center text-center pb-4">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
              <Heart size={40} className="text-rose-500 animate-pulse" fill="currentColor" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-text-primary">Ủng Hộ Truyện</DialogTitle>
            <DialogDescription className="text-text-muted font-bold">
              Tiếp sức để tác giả có thêm động lực ra chương mới nhé!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-1">Chọn số xu</label>
              <div className="grid grid-cols-3 gap-3">
                {[100, 500, 1000, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setDonateAmount(amt)}
                    className={cn(
                      "py-3 rounded-xl border-2 font-black transition-all",
                      donateAmount === amt
                        ? "bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-glow"
                        : "bg-surface-elevated border-border-brand text-text-secondary hover:border-primary-brand/30"
                    )}
                  >
                    {amt}
                  </button>
                ))}
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Số khác"
                    className="w-full h-full bg-surface-elevated border-2 border-border-brand rounded-xl px-3 text-center text-sm font-black focus:outline-none focus:ring-1 focus:ring-primary-brand appearance-none text-text-primary"
                    onChange={(e) => setDonateAmount(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-1">Lời nhắn động viên</label>
              <textarea
                rows={3}
                placeholder="Viết lời nhắn gửi đến tác giả..."
                className="w-full bg-surface-elevated border border-border-brand rounded-2xl p-4 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-brand transition-all resize-none text-sm shadow-inner"
                value={donateMessage}
                onChange={(e) => setDonateMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button
              onClick={handleDonate}
              disabled={donateLoading || donateAmount <= 0}
              className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg rounded-2xl shadow-[0_10px_25px_rgba(244,63,94,0.3)] transition-all hover:scale-[1.02] active:scale-95"
            >
              {donateLoading ? "ĐANG XỬ LÝ..." : `ỦNG HỘ ${donateAmount} XU`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review & Comment Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-surface-brand border-border-brand text-text-primary rounded-[2rem] max-w-xl w-[95%] shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-text-primary">Đánh giá & Bình luận</h3>
              <p className="text-text-muted font-medium">Chia sẻ cảm nhận của bạn về bộ truyện này</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-1">Xếp hạng của bạn</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNewReviewRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={cn(
                        "transition-all duration-300",
                        star <= newReviewRating ? "text-accent-brand drop-shadow-glow" : "text-border-brand"
                      )}
                      fill={star <= newReviewRating ? "currentColor" : "none"}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-1">Cảm nhận của bạn</label>
              <textarea
                placeholder="Bộ truyện này có gì hấp dẫn bạn? (tùy chọn)..."
                className="w-full bg-surface-elevated border-2 border-border-brand rounded-2xl p-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-brand/30 transition-all resize-none min-h-[150px] shadow-inner"
                value={newReviewContent}
                onChange={(e) => setNewReviewContent(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleReview}
                disabled={reviewLoading}
                className="w-full h-14 bg-primary-brand hover:bg-primary-light text-white font-black text-lg rounded-2xl shadow-lg shadow-primary-glow"
              >
                {reviewLoading ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ & BÌNH LUẬN"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
