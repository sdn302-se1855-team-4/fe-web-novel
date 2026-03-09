"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface AdminStory {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
  author: { id: string; displayName: string; username: string };
  _count: { chapters: number };
}

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    storyId: string;
  }>({
    open: false,
    storyId: "",
  });

  const fetchStories = () => {
    setLoading(true);
    apiFetch<AdminStory[]>("/admin/stories")
      .then((res) => setStories(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleApprove = async (storyId: string) => {
    setActionLoading(storyId);
    try {
      await apiFetch(`/admin/stories/${storyId}/approve`, { method: "PUT" });
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, isPublished: true } : s)),
      );
      showToast("Đã duyệt truyện", "success");
    } catch {
      showToast("Duyệt truyện thất bại", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = (storyId: string) => {
    setRejectModal({ open: true, storyId });
  };

  const executeReject = async () => {
    const { storyId } = rejectModal;
    if (!storyId) return;

    setRejectModal({ open: false, storyId: "" });
    setActionLoading(storyId);
    try {
      await apiFetch(`/admin/stories/${storyId}/reject`, { method: "PUT" });
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, isPublished: false } : s)),
      );
      showToast("Đã từ chối truyện", "success");
    } catch {
      showToast("Từ chối truyện thất bại", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStories = stories.filter((s) => {
    if (filter === "pending") return !s.isPublished;
    if (filter === "published") return s.isPublished;
    return true;
  });

  const pendingCount = stories.filter((s) => !s.isPublished).length;

  return (
    <div>
      <h1 className="section-title">Quản lý nội dung</h1>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setFilter("all")}
        >
          Tất cả ({stories.length})
        </button>
        <button
          className={`btn btn-sm ${filter === "pending" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setFilter("pending")}
          style={
            pendingCount > 0
              ? {
                  borderColor: "#f59e0b",
                  color: filter === "pending" ? "white" : "#f59e0b",
                  backgroundColor:
                    filter === "pending" ? "#f59e0b" : "transparent",
                }
              : {}
          }
        >
          Chờ duyệt ({pendingCount})
        </button>
        <button
          className={`btn btn-sm ${filter === "published" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setFilter("published")}
        >
          Đã duyệt ({stories.filter((s) => s.isPublished).length})
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: "300px" }} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "1rem" }}>Tiêu đề</th>
                  <th style={{ padding: "1rem" }}>Tác giả</th>
                  <th style={{ padding: "1rem" }}>Loại</th>
                  <th style={{ padding: "1rem" }}>Chương</th>
                  <th style={{ padding: "1rem" }}>Trạng thái</th>
                  <th style={{ padding: "1rem" }}>Ngày tạo</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStories.map((story) => (
                  <tr
                    key={story.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      backgroundColor: !story.isPublished
                        ? "rgba(245, 158, 11, 0.05)"
                        : "transparent",
                    }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div>
                        <strong>{story.title}</strong>
                        {story.description && (
                          <p
                            style={{
                              margin: "0.25rem 0 0",
                              fontSize: "0.8rem",
                              opacity: 0.6,
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {story.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {story.author?.displayName || story.author?.username}
                    </td>
                    <td style={{ padding: "1rem" }}>{story.type}</td>
                    <td style={{ padding: "1rem" }}>
                      {story._count?.chapters || 0}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "99px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backgroundColor: story.isPublished
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                          color: story.isPublished ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {story.isPublished ? "✅ Đã duyệt" : "⏳ Chờ duyệt"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {new Date(story.createdAt).toLocaleDateString("vi")}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                        }}
                      >
                        <Link
                          href={`/stories/${story.id}`}
                          className="btn-icon"
                          title="Xem truyện"
                          style={{ color: "var(--color-primary)" }}
                        >
                          <Eye size={18} />
                        </Link>

                        {!story.isPublished ? (
                          <button
                            className="btn-icon"
                            title="Duyệt truyện"
                            onClick={() => handleApprove(story.id)}
                            disabled={actionLoading === story.id}
                            style={{ color: "#10b981" }}
                          >
                            <CheckCircle size={18} />
                          </button>
                        ) : (
                          <button
                            className="btn-icon"
                            title="Gỡ xuất bản"
                            onClick={() => confirmReject(story.id)}
                            disabled={actionLoading === story.id}
                            style={{ color: "#ef4444" }}
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStories.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "gray",
                      }}
                    >
                      <BookOpen
                        size={32}
                        style={{ marginBottom: "0.5rem", opacity: 0.5 }}
                      />
                      <br />
                      {filter === "pending"
                        ? "Không có truyện nào chờ duyệt 🎉"
                        : "Không có truyện nào."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={rejectModal.open}
        title="Từ chối truyện"
        message="Bạn có chắc muốn từ chối truyện này? Truyện sẽ bị gỡ khỏi danh sách hiển thị công khai."
        confirmText="Xác nhận"
        cancelText="Hủy"
        variant="danger"
        onConfirm={executeReject}
        onCancel={() => setRejectModal({ open: false, storyId: "" })}
      />
    </div>
  );
}
