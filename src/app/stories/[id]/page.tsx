"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Star,
  User,
  Eye,
  BookmarkCheck,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Crown,
  Heart,
  Clock,
  Share2,
  ChevronLeft,
  ThumbsUp,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { apiFetch, ApiRequestError } from "@/lib/api";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  role: string;
  isAnonymous: boolean;
}

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
    avatar?: string;
    bio?: string;
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
  user: { id: string; name?: string; displayName?: string; username?: string; avatar?: string; isAnonymous?: boolean };
  parentId?: string;
  replies?: Comment[];
  isLiked?: boolean;
  _count?: { replies?: number; likes?: number };
}

interface Review {
  id: string;
  rating: number;
  content?: string;
  createdAt: string;
  user: { id: string; name?: string; displayName?: string; username?: string; avatar?: string; isAnonymous?: boolean };
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
  const [newReply, setNewReply] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyTargetUser, setReplyTargetUser] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chapters");
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [likedComments, setLikedComments] = useState<string[]>([]);
  const [feedTab, setFeedTab] = useState<"comments" | "reviews">("comments");
  const [originalLikes, setOriginalLikes] = useState<string[]>([]);
  const [readChapterIds, setReadChapterIds] = useState<string[]>([]);
  const [likingIds, setLikingIds] = useState<string[]>([]);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const CHAPTERS_INITIAL = 5;

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
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [authorFollowing, setAuthorFollowing] = useState(false);
  const [authorFollowingLoading, setAuthorFollowingLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<Story>(`/stories/${storyId}`),
      apiFetch<Chapter[]>(`/stories/${storyId}/chapters`),
      apiFetch<{ data: Comment[] } | Comment[]>(`/stories/${storyId}/comments`),
      isLoggedIn() ? apiFetch<UserProfile>("/users/me") : Promise.resolve(null),
      isLoggedIn() ? apiFetch<string[]>(`/reading-history/story/${storyId}`) : Promise.resolve([] as string[])
    ])
      .then(([storyResult, chaptersResult, commentsResult, profileResult, historyResult]) => {
        // Story is critical — if it fails, show not found
        if (storyResult.status === 'fulfilled') {
          const storyData = storyResult.value;
          setStory(storyData);
          if (isLoggedIn() && storyData.author?.id) {
            apiFetch<{ isFollowing: boolean }>(`/follow/check/${storyData.author.id}`)
              .then(res => setAuthorFollowing(res.isFollowing))
              .catch(() => { });
          }
        } else {
          setLoading(false);
          return;
        }

        if (chaptersResult.status === 'fulfilled') {
          setChapters(Array.isArray(chaptersResult.value) ? chaptersResult.value : []);
        }

        if (commentsResult.status === 'fulfilled') {
          const commentsData = commentsResult.value;
          const rawComments = Array.isArray(commentsData)
            ? commentsData
            : (commentsData as { data: Comment[] }).data || [];
          const flatComments: Comment[] = [];
          const likedIds: string[] = [];

          rawComments.forEach((c: Comment) => {
            flatComments.push(c);
            if (c.isLiked) likedIds.push(c.id);
            if (c.replies && Array.isArray(c.replies)) {
              c.replies.forEach((r: Comment) => {
                flatComments.push({ ...r, parentId: c.id });
                if (r.isLiked) likedIds.push(r.id);
              });
            }
          });
          setComments(flatComments);
          setLikedComments(likedIds);
          setOriginalLikes(likedIds);
        }

        if (profileResult.status === 'fulfilled' && profileResult.value) {
          setCurrentUserProfile(profileResult.value);
        }

        if (historyResult.status === 'fulfilled') {
          setReadChapterIds(historyResult.value || []);
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));

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
  const markAsRead = async (chapterId: string) => {
    if (!isLoggedIn() || readChapterIds.includes(chapterId)) return;
    setReadChapterIds(prev => [...prev, chapterId]);
    try {
      await apiFetch("/reading-history", {
        method: "POST",
        body: JSON.stringify({ storyId, chapterId }),
      });
    } catch (err) {
      console.error("Failed to save reading history optimistically:", err);
    }
  };

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
    const contentToSubmit = replyTo && replyTargetUser ? `[@${replyTargetUser}] ${newReply}` : (replyTo ? newReply : newComment);
    if (!contentToSubmit.trim()) return;
    setCommentLoading(true);
    try {
      const comment = await apiFetch<Comment>(`/stories/${storyId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: contentToSubmit, parentId: replyTo }),
      });

      setComments((prev) => [comment, ...prev]);
      if (replyTo) {
        setNewReply("");
        setReplyTo(null);
        setReplyTargetUser(null);
      } else {
        setNewComment("");
      }
    } catch (err) {
      showToast((err as Error).message || "Không thể gửi bình luận", "error");
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!isLoggedIn()) {
      showToast("Vui lòng đăng nhập để thực hiện hành động này", "error");
      router.push("/login");
      return;
    }

    if (likingIds.includes(commentId)) return;

    setLikingIds((prev) => [...prev, commentId]);
    const isLiked = likedComments.includes(commentId);

    // Optimistic update
    if (isLiked) {
      setLikedComments((prev) => prev.filter((id) => id !== commentId));
    } else {
      setLikedComments((prev) => [...prev, commentId]);
    }

    try {
      if (isLiked) {
        await apiFetch(`/comments/${commentId}/like`, { method: "DELETE" });
      } else {
        await apiFetch(`/comments/${commentId}/like`, { method: "POST" });
      }
    } catch {
      // Revert optimistic update
      if (isLiked) {
        setLikedComments((prev) => [...prev, commentId]);
      } else {
        setLikedComments((prev) => prev.filter((id) => id !== commentId));
      }
      showToast("Không thể thực hiện hành động. Vui lòng thử lại.", "error");
    } finally {
      setLikingIds((prev) => prev.filter((id) => id !== commentId));
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

  const handleAuthorFollow = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (!story?.author?.id || authorFollowingLoading) return;

    const prev = authorFollowing;
    setAuthorFollowing(!prev);
    setAuthorFollowingLoading(true);

    try {
      if (prev) {
        await apiFetch(`/follow/${story.author.id}`, { method: "DELETE" });
        showToast(`Đã bỏ theo dõi ${authorName}`, "success");
      } else {
        await apiFetch(`/follow/${story.author.id}`, { method: "POST" });
        showToast(`Đang theo dõi ${authorName}`, "success");
      }
    } catch (err) {
      setAuthorFollowing(prev);
      showToast((err as Error).message || "Thao tác thất bại", "error");
    } finally {
      setAuthorFollowingLoading(false);
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
          content: newReviewContent.trim() || undefined,
        }),
      });
      setReviews((prev) => [review, ...prev]);
      setNewReviewRating(5);
      setNewReviewContent("");
      setShowReviewDialog(false);
      showToast("Gửi đánh giá thành công!", "success");
    } catch (err) {
      console.error('Review submission error:', err);
      const message = err instanceof ApiRequestError
        ? `${err.message} (${err.statusCode})`
        : (err as Error).message || "Đã có lỗi xảy ra khi gửi đánh giá.";
      showToast(message, "error");
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
    const target = e.currentTarget;
    if (target.src !== DEFAULT_COVER) {
      target.src = DEFAULT_COVER;
    } else {
      target.style.display = 'none';
      if (target.parentElement) {
        target.parentElement.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-text-muted bg-surface-elevated"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open mb-4 opacity-20"><path d="M2 3h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H2z"/><path d="M22 3h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></svg></div>';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-brand pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 aspect-2/3 bg-surface-elevated rounded-2xl animate-pulse" />
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
    <div className="page-wrapper bg-bg-brand pb-20 overflow-x-hidden">
      {/* Immersive Background Header */}
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
        {story.coverImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-3xl opacity-20 transition-opacity duration-1000"
            style={{ backgroundImage: `url(${story.coverImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-bg-brand/0 via-bg-brand/80 to-bg-brand" />
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
            <div className="relative group rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border-brand aspect-2/3 bg-surface-elevated">
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

                {/* Genres */}
                {story.genres && story.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {story.genres.map((g: { genre?: { id: string; name: string }; id?: string; name?: string }) => (
                      <Link
                        key={g.genre?.id || g.id}
                        href={`/stories?genre=${g.genre?.id || g.id}`}
                        className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all duration-300"
                      >
                        {g.genre?.name || g.name}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted font-bold">
                  {story.author?.id ? (
                    <div className="flex items-center gap-3">
                      <Link href={`/users/${story.author.id}`} className="flex items-center gap-2 hover:text-primary-brand transition-colors group text-sm">
                        <div className="w-8 h-8 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand group-hover:bg-primary-brand group-hover:text-white transition-all shadow-sm border border-border-brand/40 overflow-hidden ring-1 ring-emerald-500/10">
                          {story.author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={story.author.avatar} alt={authorName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={14} />
                          )}
                        </div>
                        <span className="text-text-primary whitespace-nowrap">{authorName}</span>
                      </Link>

                      {isLoggedIn() && currentUserProfile?.id !== story.author.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAuthorFollow();
                          }}
                          disabled={authorFollowingLoading}
                          className={cn(
                            "h-7 px-3 text-[10px] font-black rounded-full transition-all gap-1.5 border uppercase tracking-wider",
                            authorFollowing
                              ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20"
                              : "bg-surface-elevated text-text-muted border-border-brand/60 hover:text-[#10b981] hover:border-[#10b981]/50 hover:bg-[#10b981]/5"
                          )}
                        >
                          {authorFollowing ? (
                            <>
                              <UserMinus size={12} />
                              Đang theo dõi
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} />
                              Theo dõi
                            </>
                          )}
                        </Button>
                      )}
                    </div>
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
                    onClick={() => {
                      if (chapters[0]?.id) markAsRead(chapters[0].id);
                      router.push(`/stories/${story.id}/chapters/${chapters[0]?.chapterNumber || 1}`);
                    }}
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
                  onClick={() => {
                    setFeedTab("comments");
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="h-10 px-4 border-border-brand bg-surface-elevated text-text-primary hover:bg-surface-brand font-bold rounded-lg gap-2 text-xs"
                >
                  <MessageCircle size={16} />
                  Bình luận
                </Button>

                <Button
                  onClick={() => {
                    setFeedTab("reviews");
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="h-10 px-4 border-border-brand bg-surface-elevated text-text-primary hover:bg-surface-brand font-bold rounded-lg gap-2 text-xs"
                >
                  <Star size={16} className="text-accent-brand" />
                  Đánh giá
                </Button>
              </div>
            </motion.div>

            {/* Content Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 scroll-mt-24"
              id="chapters-section"
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
                      <>
                        {(showAllChapters ? chapters : chapters.slice(0, CHAPTERS_INITIAL)).map((ch, idx) => (
                          <motion.div
                            key={ch.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * Math.min(idx, 15) }}
                          >
                            <Link
                              href={`/stories/${story.id}/chapters/${ch.chapterNumber}`}
                              onClick={() => markAsRead(ch.id)}
                              className={cn(
                                "group block relative p-3 bg-surface-brand/40 border border-border-brand/50 rounded-xl hover:bg-surface-elevated hover:border-primary-brand/30 transition-all duration-300 backdrop-blur-sm overflow-hidden",
                                readChapterIds.includes(ch.id) && "opacity-60 bg-surface-brand/20"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                {/* Chapter Number Badge */}
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-elevated border border-border-brand flex flex-col items-center justify-center group-hover:bg-primary-brand group-hover:border-primary-brand transition-all duration-300 shadow-sm relative overflow-hidden">
                                  <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter group-hover:text-slate-900 leading-none mb-0.5">CH</span>
                                  <span className="text-sm font-black text-text-primary group-hover:text-slate-950 leading-none">{ch.chapterNumber}</span>
                                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Title and Info section */}
                                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <h4 className={cn(
                                      "text-sm font-black transition-colors truncate",
                                      readChapterIds.includes(ch.id) ? "text-text-muted" : "text-text-primary group-hover:text-primary-brand"
                                    )}>
                                      {ch.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-text-muted">
                                      <div className="flex items-center gap-1">
                                        <Clock size={11} className="text-secondary-brand" />
                                        <span>{ch.createdAt ? new Intl.DateTimeFormat("vi").format(new Date(ch.createdAt)) : "Vừa xong"}</span>
                                      </div>
                                      <div className="hidden sm:flex items-center gap-1">
                                        <Eye size={11} className="text-primary-brand" />
                                        <span>Mới</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Actions/Badges */}
                                  <div className="flex items-center gap-3 shrink-0">
                                    {ch.isPremium && (
                                      <Badge className="bg-accent-brand/20 text-accent-brand border border-accent-brand/20 gap-1 px-2 py-0.5 font-black text-[9px]">
                                        <Crown size={10} fill="currentColor" />
                                        PREMIUM
                                      </Badge>
                                    )}
                                    <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                                      <span className="text-[9px] font-black text-primary-brand opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest hidden sm:block">ĐỌC NGAY</span>
                                      <div className="w-7 h-7 rounded-full border border-border-brand flex items-center justify-center group-hover:border-primary-brand group-hover:bg-primary-brand transition-all">
                                        <ChevronRight size={14} className="text-text-muted group-hover:text-slate-950" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Visual Glow Effect on Hover */}
                              <div className="absolute top-0 right-0 w-32 h-full bg-linear-to-l from-primary-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </Link>
                          </motion.div>
                        ))}

                        {chapters.length > CHAPTERS_INITIAL && (
                          <button
                            onClick={() => {
                              const next = !showAllChapters;
                              setShowAllChapters(next);
                              if (!next) {
                                setTimeout(() => {
                                  document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 50);
                              }
                            }}
                            className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border-brand/60 bg-surface-brand/40 hover:bg-surface-elevated hover:border-primary-brand/40 text-text-muted hover:text-primary-brand transition-all duration-300 text-xs font-black"
                          >
                            <span>{showAllChapters ? "Thu gọn" : "Xem thêm"}</span>
                            <ChevronDown size={15} className={cn("transition-transform duration-300", showAllChapters && "rotate-180")} />
                          </button>
                        )}
                      </>
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

            {/* Community & Comments Feed */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 space-y-6 max-w-5xl mx-auto scroll-mt-32"
              id="reviews-section"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-surface-elevated p-1 rounded-xl border border-border-brand/50">
                  <button
                    onClick={() => setFeedTab("comments")}
                    className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${feedTab === 'comments' ? 'bg-primary-brand text-slate-950 shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    <MessageCircle size={14} /> Bình luận ({rootComments.length})
                  </button>
                  <button
                    onClick={() => setFeedTab("reviews")}
                    className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${feedTab === 'reviews' ? 'bg-primary-brand text-slate-950 shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    <Star size={14} className={feedTab === 'reviews' ? 'text-slate-950' : 'text-accent-brand'} /> Đánh giá ({reviews.length})
                  </button>
                </div>
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  variant="ghost"
                  className="text-primary-brand hover:text-primary-light font-bold gap-2"
                >
                  <Star size={18} />
                  Đánh giá ngay
                </Button>
              </div>

              {/* Comments Tab */}
              {feedTab === 'comments' && (
                <div className="space-y-4">
                  {/* Comment Input Form */}
                  <div className="bg-surface-elevated/95 border border-border-brand/60 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary-brand to-secondary-brand flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white overflow-hidden">
                        {currentUserProfile?.avatar ? (
                          <div className="w-full h-full relative">
                            <Image
                              src={currentUserProfile.avatar}
                              alt="Avatar"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          currentUserProfile?.displayName?.[0]?.toUpperCase() || currentUserProfile?.username?.[0]?.toUpperCase() || "B"
                        )}
                      </div>
                      <p className="font-black text-text-primary text-xs">
                        {isLoggedIn() ? (currentUserProfile?.displayName || "Bạn") : "Đăng nhập để bình luận"}
                      </p>
                    </div>
                    <textarea
                      disabled={!isLoggedIn()}
                      placeholder={isLoggedIn() ? "Chia sẻ ý kiến của bạn..." : "Vui lòng đăng nhập để bình luận"}
                      className="w-full bg-surface-brand border border-border-brand rounded-lg p-2.5 text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-brand/30 min-h-[50px] resize-none disabled:opacity-50"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      {newComment.trim() && (
                        <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-primary text-xs font-bold" onClick={() => setNewComment("")}>Hủy</Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-[#10b981] text-[#020617] hover:bg-[#10b981]/80 transition-colors font-black px-4 rounded-lg text-xs"
                        onClick={handleComment}
                        disabled={!newComment.trim() || commentLoading || !isLoggedIn()}
                      >
                        {commentLoading ? "Đang gửi..." : "Gửi bình luận"}
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {rootComments.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-border-brand rounded-2xl">
                        <MessageCircle size={40} className="mx-auto mb-4 text-text-muted opacity-30" />
                        <p className="text-text-muted font-medium">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                      </div>
                    ) : (
                      rootComments.map((comment) => {
                        const authorName = comment.user?.isAnonymous
                          ? "Người dùng"
                          : comment.user?.displayName || comment.user?.username || comment.user?.name || "Người dùng";
                        const initial = authorName[0].toUpperCase();
                        const repliesForThisComment = childComments
                          .filter((c: Comment) => c.parentId === comment.id)
                          .sort((a: Comment, b: Comment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                        const isExpanded = expandedComments.includes(comment.id);

                        return (
                          <div key={comment.id} className="group">
                            <div className="bg-surface-elevated/95 border border-border-brand/60 p-3 rounded-lg group-hover:bg-surface-brand transition-all shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary-brand to-secondary-brand flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white overflow-hidden">
                                  {comment.user?.avatar && !comment.user?.isAnonymous ? (
                                    <div className="w-full h-full relative">
                                      <Image src={comment.user.avatar} alt={authorName} fill className="object-cover" unoptimized />
                                    </div>
                                  ) : (
                                    initial
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-text-primary text-xs">{authorName}</p>
                                  <p className="text-[9px] text-text-muted font-bold">{new Intl.DateTimeFormat("vi").format(new Date(comment.createdAt))}</p>
                                </div>
                              </div>
                              <div className="border-t border-border-brand my-1.5" />
                              <p className="text-text-secondary leading-relaxed font-medium text-xs">
                                {comment.content}
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                <button
                                  className={cn(
                                    "flex items-center gap-1 text-xs font-bold transition-colors",
                                    likedComments.includes(comment.id) ? "text-red-500 scale-110" : "text-text-muted hover:text-red-500"
                                  )}
                                  onClick={() => toggleLike(comment.id)}
                                  disabled={likingIds.includes(comment.id)}
                                >
                                  <ThumbsUp size={14} fill={likedComments.includes(comment.id) ? "#ef4444" : "none"} stroke={likedComments.includes(comment.id) ? "#ef4444" : "currentColor"} />
                                  <span className="ml-1">
                                    {(comment._count?.likes || 0) +
                                      (originalLikes.includes(comment.id) && !likedComments.includes(comment.id) ? -1 :
                                        !originalLikes.includes(comment.id) && likedComments.includes(comment.id) ? 1 : 0)}
                                  </span>
                                </button>
                                <button
                                  className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary-brand transition-colors"
                                  onClick={() => {
                                    setReplyTo(comment.id);
                                    setNewReply("");
                                    setReplyTargetUser(authorName);
                                  }}
                                >
                                  <MessageCircle size={12} fill="currentColor" /> Trả lời
                                </button>
                                {repliesForThisComment.length > 0 && (
                                  <button
                                    className="flex items-center gap-1 text-xs font-bold text-[#10b981] hover:underline transition-all ml-auto"
                                    onClick={() => {
                                      setExpandedComments(prev =>
                                        prev.includes(comment.id) ? prev.filter(id => id !== comment.id) : [...prev, comment.id]
                                      )
                                    }}
                                  >
                                    <MessageCircle size={12} /> {isExpanded ? "Ẩn" : `${repliesForThisComment.length}`} phản hồi
                                  </button>
                                )}
                              </div>

                              {isExpanded && (
                                <div className="pl-8 mt-4 space-y-3 border-t border-border-brand/50 pt-3">
                                  {repliesForThisComment.map(reply => {
                                    const replyAuthorName = reply.user?.isAnonymous
                                      ? "Người dùng"
                                      : reply.user?.displayName || reply.user?.username || reply.user?.name || "Người dùng";
                                    const match = reply.content.match(/^\[@([^\]]+)\]\s*(.*)/);
                                    const taggedName = match ? match[1] : null;
                                    const actualContent = match ? match[2] : reply.content;
                                    return (
                                      <div key={reply.id} className="group/reply bg-surface-brand border border-border-brand/30 p-3 rounded-lg transition-all hover:bg-surface-elevated shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <p className="font-bold text-xs text-text-primary flex items-center gap-1.5 flex-wrap">
                                            {replyAuthorName}
                                            {taggedName && (
                                              <span className="text-text-muted font-medium text-[10px] flex items-center gap-1">
                                                trả lời <span className="text-emerald-500">@{taggedName}</span>
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-[9px] text-text-muted font-bold">• {new Intl.DateTimeFormat("vi").format(new Date(reply.createdAt))}</p>
                                        </div>
                                        <p className="text-text-secondary text-xs font-medium mb-2">{actualContent}</p>
                                        <div className="flex items-center gap-2">
                                          <button
                                            className={cn(
                                              "flex items-center gap-0.5 text-[10px] font-bold transition-all duration-200",
                                              likedComments.includes(reply.id) ? "text-red-500 scale-110" : "text-text-muted hover:text-red-500"
                                            )}
                                            onClick={() => toggleLike(reply.id)}
                                            disabled={likingIds.includes(reply.id)}
                                          >
                                            <ThumbsUp size={12} fill={likedComments.includes(reply.id) ? "#ef4444" : "none"} stroke={likedComments.includes(reply.id) ? "#ef4444" : "currentColor"} />
                                            <span className="ml-0.5">
                                              {(reply._count?.likes || 0) +
                                                (originalLikes.includes(reply.id) && !likedComments.includes(reply.id) ? -1 :
                                                  !originalLikes.includes(reply.id) && likedComments.includes(reply.id) ? 1 : 0)}
                                            </span>
                                          </button>
                                          <button
                                            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-primary-brand transition-colors"
                                            onClick={() => {
                                              setReplyTo(comment.id);
                                              setNewReply("");
                                              setReplyTargetUser(replyAuthorName);
                                            }}
                                          >
                                            <MessageCircle size={10} fill="currentColor" /> Trả lời
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {replyTo === comment.id && (
                                <div className="mt-4 pt-3 border-t border-slate-200/50 pl-8">
                                  {replyTargetUser && (
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                      <span className="text-xs text-text-muted">Trả lời</span>
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                        @{replyTargetUser}
                                      </span>
                                    </div>
                                  )}
                                  <textarea
                                    autoFocus
                                    placeholder="Viết câu trả lời..."
                                    className="w-full bg-surface-brand border border-border-brand rounded-lg p-2 text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-brand/30 min-h-[50px] resize-none"
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-secondary text-xs font-bold" onClick={() => { setReplyTo(null); setNewReply(""); setReplyTargetUser(null); }}>Hủy</Button>
                                    <Button
                                      size="sm"
                                      className="bg-[#10b981] text-white hover:bg-[#10b981]/80 transition-colors font-black px-3 rounded-lg text-xs"
                                      onClick={handleComment}
                                      disabled={!newReply.trim() || commentLoading}
                                    >
                                      {commentLoading ? "..." : "Gửi"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {feedTab === 'reviews' && (
                <div className="space-y-4">
                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-border-brand rounded-2xl">
                        <Star size={40} className="mx-auto mb-4 text-text-muted opacity-30" />
                        <p className="text-text-muted font-medium">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                      </div>
                    ) : (
                      reviews.map((review) => {
                        const authorName = review.user?.isAnonymous
                          ? "Người dùng"
                          : review.user?.displayName || review.user?.username || review.user?.name || "Người dùng";
                        const initial = authorName[0].toUpperCase();

                        return (
                          <div key={review.id} className="group">
                            <div className="bg-surface-elevated/95 border border-border-brand/60 p-3 rounded-lg group-hover:bg-surface-brand transition-all shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary-brand to-secondary-brand flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white overflow-hidden">
                                    {review.user?.avatar && !review.user?.isAnonymous ? (
                                      <div className="w-full h-full relative">
                                        <Image src={review.user.avatar} alt={authorName} fill className="object-cover" unoptimized />
                                      </div>
                                    ) : (
                                      initial
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-bold text-text-primary text-xs">{authorName}</p>
                                      <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={12} className={i < review.rating ? "text-accent-brand" : "text-border-brand/30"} fill={i < review.rating ? "currentColor" : "none"} />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-text-muted font-bold">{new Intl.DateTimeFormat("vi").format(new Date(review.createdAt))}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-border-brand my-1.5" />
                              {review.content && (
                                <p className="text-text-secondary font-medium text-xs leading-relaxed mt-1">
                                  {review.content}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <Dialog open={showDonate} onOpenChange={setShowDonate}>
        <DialogContent className="bg-surface-brand/95 backdrop-blur-3xl border-border-brand text-text-primary rounded-4xl max-w-md w-[95%] shadow-2xl">
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

      {/* Review Dialog - Simple Star Rating */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-surface-brand border border-border-brand/40 text-text-primary rounded-2xl max-w-sm w-[90%] shadow-xl p-6 overflow-hidden">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-accent-brand/20 to-accent-brand/10 flex items-center justify-center">
              <Star size={24} className="text-accent-brand" fill="currentColor" />
            </div>
            <h2 className="text-xl font-black text-text-primary">Đánh giá</h2>
            <p className="text-sm text-text-muted">Chọn số sao và gửi đánh giá</p>

            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReviewRating(star)}
                  className={cn(
                    "rounded-lg p-2 transition-transform duration-150",
                    star <= newReviewRating
                      ? "scale-110"
                      : "hover:scale-105"
                  )}
                >
                  <Star
                    size={34}
                    className={cn(
                      "transition-colors",
                      star <= newReviewRating ? "text-accent-brand" : "text-border-brand/50"
                    )}
                    fill={star <= newReviewRating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Chia sẻ cảm nghĩ của bạn về truyện (tùy chọn)..."
              className="w-full bg-surface-elevated border border-border-brand rounded-xl p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-brand text-sm resize-none min-h-[100px]"
              value={newReviewContent}
              onChange={(e) => setNewReviewContent(e.target.value)}
            />

            <button
              onClick={handleReview}
              disabled={reviewLoading}
              className="w-full h-12 bg-primary-brand hover:bg-primary-light text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reviewLoading ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
