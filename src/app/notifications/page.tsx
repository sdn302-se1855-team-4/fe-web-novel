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
    <div className="container py-8 sm:py-12 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
        <h1 className="flex items-center gap-3 text-3xl font-black text-text-primary italic uppercase tracking-tight">
          <Bell size={32} className="text-emerald-500" /> Thông báo
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse capitalize tracking-normal italic-none">
              {unreadCount} mới
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
        <div className="flex flex-col items-center justify-center gap-6 py-24 text-text-muted text-center max-w-md mx-auto">
          <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center">
            <Inbox size={48} className="opacity-20 text-emerald-500" />
          </div>
          <p className="font-medium text-lg">Hộp thư của bạn đang trống</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border-brand/60 bg-surface-brand shadow-sm overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start sm:items-center gap-4 p-5 transition-all duration-300 border-l-4 border-b border-border-brand/30 last:border-b-0 ${
                n.isRead
                  ? "bg-transparent border-l-transparent opacity-80"
                  : "bg-emerald-500/5 border-l-emerald-500"
              } hover:bg-surface-elevated`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm sm:text-base leading-relaxed mb-1 ${n.isRead ? "text-text-secondary" : "font-semibold text-text-primary"}`}
                >
                  {n.message}
                </p>
                <span className="text-xs font-medium text-text-muted">
                  {timeAgo(n.createdAt)}
                </span>
              </div>
              {!n.isRead && (
                <button
                  className="p-2 rounded-xl text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-95 shrink-0"
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
