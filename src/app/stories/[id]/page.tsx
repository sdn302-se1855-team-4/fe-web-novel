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
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch reviews
    apiFetch<{ data: Review[] }>(`/reviews/story/${storyId}`)
      .then((res) => setReviews(res.data || []))
      .catch(() => {});

    // Check bookmark status
    if (isLoggedIn()) {
      apiFetch<{ isBookmarked: boolean }>(`/bookmarks/check/${storyId}`)
        .then((res) =>
          setBookmarked(
            res.isBookmarked || (res as unknown as boolean) === true,
          ),
        )
        .catch(() => {});
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
      <div className="min-h-screen bg-[#020617] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-10 bg-white/5 rounded-lg animate-pulse w-2/3" />
              <div className="h-6 bg-white/5 rounded-lg animate-pulse w-1/3" />
              <div className="h-32 bg-white/5 rounded-lg animate-pulse w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy truyện</h2>
          <Button onClick={() => router.push("/stories")} variant="outline" className="border-white/10 hover:bg-white/5 text-white">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-20 overflow-x-hidden">
      {/* Immersive Background Header */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {story.coverImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-2xl opacity-30 transition-opacity duration-1000"
            style={{ backgroundImage: `url(${story.coverImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/0 via-[#020617]/60 to-[#020617]" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 -mt-32 md:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Left Sidebar - Cover Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-72 lg:w-80 shrink-0"
          >
            <div className="relative group rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 aspect-[2/3] bg-slate-900">
              {story.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900">
                  <BookOpen size={64} className="mb-4 opacity-20" />
                  <span className="text-sm font-medium opacity-40">Không có ảnh bìa</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <Button variant="outline" className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-[#10b981] hover:border-[#10b981] hover:text-[#020617] transition-all rounded-xl">
                  Xem ảnh lớn
                </Button>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Button 
                onClick={handleBookmark}
                className={cn(
                  "w-full h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                  bookmarked 
                    ? "bg-[#10b981] text-[#020617] hover:bg-[#0da673]" 
                    : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                )}
              >
                {bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                {bookmarked ? "Đã theo dõi" : "Theo dõi truyện"}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDonate(true)}
                  className="h-12 border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all rounded-xl gap-2 cursor-pointer"
                >
                  <Heart size={18} fill="currentColor" />
                  Ủng hộ
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all rounded-xl gap-2 cursor-pointer"
                >
                  <Share2 size={18} />
                  Chia sẻ
                </Button>
              </div>
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
                    <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border-white/10 text-slate-400">
                      {story.type}
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                  {story.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-slate-400 font-medium">
                  {story.author?.id ? (
                    <Link href={`/users/${story.author.id}`} className="flex items-center gap-2 hover:text-[#10b981] transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981] group-hover:bg-[#10b981] group-hover:text-[#020617] transition-all">
                        <User size={14} />
                      </div>
                      <span>{authorName}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      <User size={16} />
                      {authorName}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-500" size={16} fill="currentColor" />
                    <span className="text-white font-bold">{story.rating?.toFixed(1) || "5.0"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye size={16} />
                    <span>{Intl.NumberFormat("vi").format(story.viewCount || 0)} lượt xem</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Cập nhật: {story.updatedAt ? new Intl.DateTimeFormat("vi").format(new Date(story.updatedAt)) : "Vừa xong"}</span>
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

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#10b981] rounded-full" />
                  Cốt truyện
                </h3>
                <p className="text-slate-400 leading-relaxed text-lg line-clamp-6 hover:line-clamp-none transition-all duration-500 cursor-pointer italic">
                  {story.description || "Chưa có mô tả cho bộ truyện này."}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                {chapters.length > 0 && (
                  <Button 
                    onClick={() => router.push(`/stories/${story.id}/chapters/${chapters[0]?.chapterNumber || 1}`)}
                    className="h-14 px-10 bg-[#10b981] hover:bg-[#0da673] text-[#020617] font-black rounded-2xl gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                  >
                    <BookOpen size={20} />
                    ĐỌC TỪ ĐẦU
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="h-14 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold rounded-2xl gap-2"
                >
                  <MessageCircle size={20} />
                  BÌNH LUẬN
                </Button>
              </div>
            </motion.div>

            {/* Content Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <Tabs defaultValue="chapters" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/5 p-1.5 h-auto rounded-2xl border border-white/10 backdrop-blur-xl mb-8 flex-wrap justify-start">
                  <TabsTrigger 
                    value="chapters" 
                    className="rounded-xl px-6 py-3 data-[state=active]:bg-[#10b981] data-[state=active]:text-[#020617] text-slate-400 font-bold transition-all gap-2"
                  >
                    <BookOpen size={18} />
                    CHƯƠNG ({chapters.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments" 
                    className="rounded-xl px-6 py-3 data-[state=active]:bg-[#10b981] data-[state=active]:text-[#020617] text-slate-400 font-bold transition-all gap-2"
                  >
                    <MessageCircle size={18} />
                    BÌNH LUẬN ({comments.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="rounded-xl px-6 py-3 data-[state=active]:bg-[#10b981] data-[state=active]:text-[#020617] text-slate-400 font-bold transition-all gap-2"
                  >
                    <Star size={18} />
                    PHẢN HỒI ({reviews.length})
                  </TabsTrigger>
                </TabsList>

                {/* Chapters Content */}
                <TabsContent value="chapters" className="mt-0 outline-none">
                  <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5 backdrop-blur-md shadow-2xl">
                    {chapters.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5">
                        {chapters.map((ch) => (
                          <Link
                            key={ch.id}
                            href={`/stories/${story.id}/chapters/${ch.chapterNumber}`}
                            className="flex items-center justify-between p-6 bg-[#020617]/40 hover:bg-white/5 hover:pl-8 transition-all group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-slate-400 group-hover:bg-[#10b981] group-hover:text-[#020617] transition-all">
                                  {ch.chapterNumber}
                                </div>
                                <div className="truncate">
                                  <p className="text-white font-bold truncate group-hover:text-[#10b981] transition-colors">{ch.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">Cập nhật: {ch.createdAt ? new Intl.DateTimeFormat("vi").format(new Date(ch.createdAt)) : "Hôm nay"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              {ch.isPremium && <Crown size={14} className="text-yellow-500" />}
                              <ChevronRight size={18} className="text-slate-700 group-hover:text-white transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center">
                        <p className="text-slate-500 font-medium">Chưa có chương nào được đăng tải.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Comments Content */}
                <TabsContent value="comments" className="mt-0 outline-none">
                  <div className="space-y-8">
                    {/* Comment Form */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl space-y-4">
                       <h4 className="text-lg font-bold text-white">Viết bình luận</h4>
                       <textarea 
                         rows={4}
                         placeholder="Bạn nghĩ gì về bộ truyện này?"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 transition-all resize-none"
                         value={newComment}
                         onChange={(e) => setNewComment(e.target.value)}
                       />
                       <div className="flex justify-end">
                         <Button 
                           onClick={handleComment} 
                           disabled={commentLoading || !newComment.trim()}
                           className="bg-[#10b981] hover:bg-[#0da673] text-[#020617] font-bold rounded-xl px-8"
                         >
                           GỬI BÌNH LUẬN
                         </Button>
                       </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-6">
                      {rootComments.length > 0 ? rootComments.map((comment) => (
                        <div key={comment.id} className="group">
                           <div className="bg-white/5 border border-white/10 p-6 rounded-3xl group-hover:bg-white/[0.07] transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-[#10b981] flex items-center justify-center text-white font-black text-sm">
                                    {(comment.user?.name || "A")[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white">{comment.user?.name || "Người dùng ẩn danh"}</p>
                                    <p className="text-xs text-slate-500">{new Intl.DateTimeFormat("vi").format(new Date(comment.createdAt))}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white" onClick={() => setReplyTo(comment.id)}>
                                  Trả lời
                                </Button>
                              </div>
                              <p className="text-slate-300 leading-relaxed pl-13">
                                {comment.content}
                              </p>
                           </div>

                           {/* Replies Container */}
                           <div className="pl-12 mt-3 space-y-3">
                              {childComments.filter(c => c.parentId === comment.id).map(reply => (
                                <div key={reply.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                   <div className="flex items-center gap-2 mb-2">
                                      <p className="font-bold text-sm text-[#10b981]">{reply.user?.name || "Ẩn danh"}</p>
                                      <p className="text-[10px] text-slate-600 tracking-tighter uppercase font-bold">• {new Intl.DateTimeFormat("vi").format(new Date(reply.createdAt))}</p>
                                   </div>
                                   <p className="text-slate-400 text-sm">{reply.content}</p>
                                </div>
                              ))}

                              {replyTo === comment.id && (
                                <div className="bg-white/[0.05] border border-[#10b981]/20 p-4 rounded-2xl flex flex-col gap-3">
                                   <textarea 
                                     autoFocus
                                     placeholder={`Trả lời ${comment.user?.name}...`}
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
                        </div>
                      )) : (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                           <MessageCircle size={40} className="mx-auto mb-4 text-slate-700 opacity-30" />
                           <p className="text-slate-500 font-medium tracking-tight">Trở thành người đầu tiên thảo luận về bộ truyện này!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Reviews Content */}
                <TabsContent value="reviews" className="mt-0 outline-none">
                  <div className="space-y-8">
                     <div className="bg-gradient-to-br from-[#10b981]/5 to-blue-500/5 border border-[#10b981]/10 p-8 rounded-3xl backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                           <div className="space-y-4">
                              <h4 className="text-2xl font-black text-white">Xếp hạng của bạn</h4>
                              <p className="text-slate-400 max-w-sm">Chia sẻ cảm nhận của bạn để cộng đồng cùng biết nhé!</p>
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
                                       size={36}
                                       className={cn(
                                         "transition-all duration-300",
                                         star <= newReviewRating ? "text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "text-slate-700"
                                       )}
                                       fill={star <= newReviewRating ? "currentColor" : "none"}
                                     />
                                   </motion.button>
                                 ))}
                              </div>
                           </div>
                           <div className="flex-1 space-y-4">
                              <textarea 
                                placeholder="Viết cảm nhận chi tiết hơn về truyện (tùy chọn)..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 transition-all resize-none min-h-[100px]"
                                value={newReviewContent}
                                onChange={(e) => setNewReviewContent(e.target.value)}
                              />
                              <Button 
                                onClick={handleReview} 
                                disabled={reviewLoading}
                                className="w-full bg-[#10b981] hover:bg-[#0da673] text-[#020617] font-bold rounded-xl h-12"
                              >
                                {reviewLoading ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
                              </Button>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.length > 0 ? reviews.map((review) => (
                          <div key={review.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/[0.08] transition-all">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 font-bold">
                                      {(review.user?.name || "U")[0]}
                                   </div>
                                   <div>
                                      <p className="font-bold text-white text-sm">{review.user?.name || "Người dùng"}</p>
                                      <div className="flex gap-0.5">
                                         {[...Array(5)].map((_, i) => (
                                           <Star key={i} size={10} className={i < review.rating ? "text-yellow-500" : "text-slate-800"} fill={i < review.rating ? "currentColor" : "none"} />
                                         ))}
                                      </div>
                                   </div>
                                </div>
                                <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">{new Intl.DateTimeFormat("vi").format(new Date(review.createdAt))}</span>
                             </div>
                             {review.content && (
                               <p className="text-slate-400 text-sm leading-relaxed italic">"{review.content}"</p>
                             )}
                          </div>
                        )) : (
                          <div className="col-span-full py-20 text-center text-slate-700">
                             Chưa có đánh giá chi tiết nào.
                          </div>
                        )}
                     </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Donate Dialog (Refined) */}
      <Dialog open={showDonate} onOpenChange={setShowDonate}>
        <DialogContent className="bg-[#0f172a]/95 backdrop-blur-3xl border-white/10 text-white rounded-[2rem] max-w-md w-[95%]">
          <DialogHeader className="items-center text-center pb-4">
             <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                <Heart size={40} className="text-rose-500 animate-pulse" fill="currentColor" />
             </div>
             <DialogTitle className="text-2xl font-black tracking-tight">Ủng Hộ Truyện</DialogTitle>
             <DialogDescription className="text-slate-400 font-medium">
               Tiếp sức để tác giả có thêm động lực ra chương mới nhé!
             </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
               <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Chọn số xu</label>
               <div className="grid grid-cols-3 gap-3">
                  {[100, 500, 1000, 5000, 10000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setDonateAmount(amt)}
                      className={cn(
                        "py-3 rounded-xl border font-black transition-all",
                        donateAmount === amt 
                          ? "bg-[#10b981] border-[#10b981] text-[#020617] shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                      )}
                    >
                      {amt}
                    </button>
                  ))}
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="Số khác"
                      className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-3 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#10b981] appearance-none"
                      onChange={(e) => setDonateAmount(Number(e.target.value))}
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Lời nhắn động viên</label>
               <textarea 
                  rows={3} 
                  placeholder="Viết lời nhắn gửi đến tác giả..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-[#10b981] transition-all resize-none text-sm"
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
    </div>
  );
}
