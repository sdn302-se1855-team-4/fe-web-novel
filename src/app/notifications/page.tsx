"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    apiFetch<{ data: Notification[]; unreadCount: number }>(
      "/notifications?limit=50",
    )
      .then((res) => {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((p) => Math.max(0, p - 1));
    } catch {
      //
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      //
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-extrabold text-text-primary">
          <Bell size={24} /> Thông báo
          {unreadCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold ml-2">
              {unreadCount} chưa đọc
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            className="btn btn-outline btn-sm sm:btn-md border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-500 flex items-center gap-2"
            onClick={markAllRead}
          >
            <CheckCheck size={18} /> Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-text-muted">
          <Bell size={48} />
          <p>Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[2px] border border-border-brand/50 rounded-2xl overflow-hidden shadow-sm">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-4 p-4 transition-colors duration-200 ${
                !n.isRead
                  ? "bg-emerald-500/5 border-l-4 border-emerald-500"
                  : "bg-surface-brand/80 hover:bg-surface-elevated"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary mb-1 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-xs text-text-muted">
                  {timeAgo(n.createdAt)}
                </span>
              </div>
              {!n.isRead && (
                <button
                  className="flex-shrink-0 text-text-muted hover:text-emerald-500 transition-colors p-2 hover:bg-emerald-500/10 rounded-lg"
                  onClick={() => markAsRead(n.id)}
                  title="Đánh dấu đã đọc"
                >
                  <Check size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
