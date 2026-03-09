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
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./storyDetail.module.css";

interface Story {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  type?: string;
  status?: string;
  viewCount?: number;
  averageRating?: number;
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
  const [activeTab, setActiveTab] = useState<
    "chapters" | "comments" | "reviews"
  >("chapters");

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
      alert("Ủng hộ thành công! Cảm ơn bạn.");
      setShowDonate(false);
      setDonateMessage("");
    } catch (err) {
      alert(
        (err as Error).message || "Ủng hộ thất bại. Vui lòng kiểm tra số dư.",
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
      alert((err as Error).message || "Bạn đã đánh giá bộ truyện này rồi.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Group comments into threaded format
  const rootComments = comments.filter((c) => !c.parentId);
  const childComments = comments.filter((c) => c.parentId);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className={styles.loadingWrapper}>
            <div className={`skeleton ${styles.coverSkeleton}`} />
            <div className={styles.infoSkeleton}>
              <div className="skeleton" style={{ height: 32, width: "60%" }} />
              <div className="skeleton" style={{ height: 18, width: "30%" }} />
              <div className="skeleton" style={{ height: 80, width: "100%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="page-wrapper">
        <div className="container text-center">
          <h2>Không tìm thấy truyện</h2>
        </div>
      </div>
    );
  }

  const authorName =
    story.author?.displayName ||
    story.author?.username ||
    story.author?.name ||
    "Unknown";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    (e.target as HTMLImageElement).src = DEFAULT_COVER;
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Story Header */}
        <div className={styles.header}>
          <div className={styles.coverWrapper}>
            {story.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.coverImage}
                alt={story.title}
                className={styles.cover}
                onError={handleImageError}
              />
            ) : (
              <div className={styles.coverPlaceholder}>
                <BookOpen size={48} />
              </div>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{story.title}</h1>

            <div className={styles.authorRow}>
              <User size={16} />
              <span>{authorName}</span>
            </div>

            <div className={styles.metaRow}>
              {story.status && (
                <span
                  className={`badge ${story.status === "COMPLETED" ? "badge-success" : story.status === "ONGOING" ? "badge-primary" : "badge-warning"}`}
                >
                  {story.status === "ONGOING"
                    ? "Đang ra"
                    : story.status === "COMPLETED"
                      ? "Hoàn thành"
                      : "Tạm dừng"}
                </span>
              )}
              {story.type && (
                <span className="badge badge-primary">{story.type}</span>
              )}
              {story.averageRating !== undefined && story.averageRating > 0 && (
                <span className={styles.ratingBadge}>
                  <Star size={14} fill="currentColor" />{" "}
                  {story.averageRating.toFixed(1)}
                </span>
              )}
              <span className={styles.metaItem}>
                <Eye size={14} />{" "}
                {Intl.NumberFormat("vi").format(story.viewCount || 0)}
              </span>
              <span className={styles.metaItem}>
                <BookOpen size={14} /> {story._count?.chapters || 0} chương
              </span>
            </div>

            {story.genres && story.genres.length > 0 && (
              <div className={styles.genres}>
                {story.genres.map((g) => (
                  <span key={g.id} className={styles.genreTag}>
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.actions}>
              {chapters.length > 0 && (
                <Link
                  href={`/stories/${story.id}/chapters/1`}
                  className="btn btn-primary"
                >
                  <BookOpen size={18} /> Đọc từ đầu
                </Link>
              )}
              <button
                className={`btn ${bookmarked ? "btn-accent" : "btn-outline"}`}
                onClick={handleBookmark}
              >
                {bookmarked ? (
                  <BookmarkCheck size={18} />
                ) : (
                  <Bookmark size={18} />
                )}
                {bookmarked ? "Đã lưu" : "Lưu truyện"}
              </button>
              <button
                className="btn btn-outline"
                style={{ color: "#ef4444", borderColor: "#ef4444" }}
                onClick={() => setShowDonate(true)}
              >
                <Heart size={18} fill="currentColor" /> Ủng hộ
              </button>
            </div>

            {story.description && (
              <p className={styles.description}>{story.description}</p>
            )}
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "chapters" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("chapters")}
          >
            <BookOpen size={16} /> Danh sách chương ({chapters.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "comments" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            <MessageCircle size={16} /> Bình luận ({comments.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <Star size={16} /> Đánh giá ({reviews.length})
          </button>
        </div>

        {/* Chapter List */}
        {activeTab === "chapters" && (
          <div className={styles.chapterList}>
            {chapters.length > 0 ? (
              chapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/stories/${story.id}/chapters/${ch.chapterNumber}`}
                  className={styles.chapterItem}
                >
                  <div className={styles.chapterInfo}>
                    <span className={styles.chapterNumber}>
                      Chương {ch.chapterNumber}
                    </span>
                    <span className={styles.chapterTitle}>{ch.title}</span>
                  </div>
                  <div className={styles.chapterMeta}>
                    {ch.isPremium && (
                      <Crown size={14} className={styles.premiumIcon} />
                    )}
                    {ch.createdAt && (
                      <span className="text-xs text-muted">
                        {new Intl.DateTimeFormat("vi", {
                          day: "2-digit",
                          month: "2-digit",
                        }).format(new Date(ch.createdAt))}
                      </span>
                    )}
                    <ChevronRight size={16} />
                  </div>
                </Link>
              ))
            ) : (
              <p
                className="text-center text-muted"
                style={{ padding: "var(--spacing-2xl)" }}
              >
                Chưa có chương nào.
              </p>
            )}
          </div>
        )}

        {/* Comments */}
        {activeTab === "comments" && (
          <div className={styles.commentsSection}>
            <div className={styles.commentForm}>
              <textarea
                className="input textarea"
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleComment}
                disabled={commentLoading || !newComment.trim()}
              >
                {commentLoading ? "Đang gửi..." : "Gửi bình luận"}
              </button>
            </div>

            <div className={styles.commentList}>
              {rootComments.length > 0 ? (
                rootComments.map((comment) => (
                  <div key={comment.id} className={styles.commentThread}>
                    <div className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor}>
                          <User size={14} /> {comment.user?.name || "Ẩn danh"}
                        </span>
                        <span className="text-xs text-muted">
                          {new Intl.DateTimeFormat("vi", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }).format(new Date(comment.createdAt))}
                        </span>
                      </div>
                      <p className={styles.commentContent}>{comment.content}</p>
                      <button
                        className={styles.replyBtn}
                        onClick={() => setReplyTo(comment.id)}
                      >
                        Trả lời
                      </button>
                    </div>

                    {/* Replies */}
                    {childComments
                      .filter((c) => c.parentId === comment.id)
                      .map((reply) => (
                        <div key={reply.id} className={styles.replyItem}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentAuthor}>
                              <User size={14} /> {reply.user?.name || "Ẩn danh"}
                            </span>
                            <span className="text-xs text-muted">
                              {new Intl.DateTimeFormat("vi", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }).format(new Date(reply.createdAt))}
                            </span>
                          </div>
                          <p className={styles.commentContent}>
                            {reply.content}
                          </p>
                        </div>
                      ))}

                    {replyTo === comment.id && (
                      <div className={styles.replyForm}>
                        <textarea
                          className="input textarea"
                          placeholder="Viết trả lời..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={2}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={handleComment}
                            disabled={commentLoading || !newComment.trim()}
                          >
                            {commentLoading ? "Đang gửi..." : "Gửi"}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setReplyTo(null);
                              setNewComment("");
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p
                  className="text-center text-muted"
                  style={{ padding: "var(--spacing-2xl)" }}
                >
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className={styles.commentsSection}>
            <div className={styles.commentForm}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReviewRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Star
                      size={24}
                      fill={star <= newReviewRating ? "#f59e0b" : "none"}
                      color={
                        star <= newReviewRating
                          ? "#f59e0b"
                          : "var(--color-text-muted)"
                      }
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="input textarea"
                placeholder="Viết đánh giá của bạn (không bắt buộc)..."
                value={newReviewContent}
                onChange={(e) => setNewReviewContent(e.target.value)}
                rows={3}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleReview}
                disabled={reviewLoading}
              >
                {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>

            <div className={styles.commentList}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>
                        <User size={14} /> {review.user?.name || "Ẩn danh"}
                      </span>
                      <div
                        style={{ display: "flex", gap: 2, color: "#f59e0b" }}
                      >
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <span
                        className="text-xs text-muted"
                        style={{ marginLeft: "auto" }}
                      >
                        {new Intl.DateTimeFormat("vi", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(review.createdAt))}
                      </span>
                    </div>
                    {review.content && (
                      <p className={styles.commentContent}>{review.content}</p>
                    )}
                  </div>
                ))
              ) : (
                <p
                  className="text-center text-muted"
                  style={{ padding: "var(--spacing-2xl)" }}
                >
                  Chưa có đánh giá nào.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Donate Modal */}
      {showDonate && (
        <div
          className={styles["modal-backdrop"]}
          onClick={() => setShowDonate(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2 className={styles["modal-title"]}>
                <Gift size={24} color="#ef4444" /> Ủng hộ tác giả
              </h2>
              <button className="btn-icon" onClick={() => setShowDonate(false)}>
                x
              </button>
            </div>
            <div
              className="modal-body"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <p className="text-secondary text-sm">
                Bạn đang ủng hộ tác giả của bộ truyện{" "}
                <strong>{story.title}</strong>
              </p>

              <div>
                <label className="form-label">Số xu ủng hộ</label>
                <input
                  type="number"
                  className="input"
                  min="10"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="form-label">Lời nhắn (tùy chọn)</label>
                <textarea
                  className="input textarea"
                  rows={3}
                  placeholder="Gửi lời động viên tới tác giả..."
                  value={donateMessage}
                  onChange={(e) => setDonateMessage(e.target.value)}
                />
              </div>
            </div>
            <div className={styles["modal-footer"]}>
              <button
                className="btn btn-outline"
                onClick={() => setShowDonate(false)}
                disabled={donateLoading}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDonate}
                disabled={donateLoading || donateAmount <= 0}
              >
                {donateLoading ? "Đang xử lý..." : `Ủng hộ ${donateAmount} Xu`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
