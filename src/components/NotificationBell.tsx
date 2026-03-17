"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications, type Notification as AppNotification } from "@/contexts/NotificationContext";
import { Bell, Check, BookOpen, MessageSquare, UserPlus, Gift, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { requestFCMToken } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setTimeout(() => {
        setPushEnabled(Notification.permission === "granted");
      }, 0);
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      const token = await requestFCMToken();
      if (token) {
        await apiFetch("/notifications/fcm-token", {
          method: "POST",
          body: JSON.stringify({ token, device: navigator.userAgent }),
        });
        setPushEnabled(true);
        showToast("Đã bật thông báo đẩy thành công", "success");
      } else {
        showToast("Không thể bật thông báo (Cần cấp quyền)", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Có lỗi xảy ra khi bật thông báo", "error");
    }
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "NEW_CHAPTER":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "NEW_COMMENT":
      case "NEW_REVIEW":
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case "NEW_FOLLOWER":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "DONATION_RECEIVED":
        return <Gift className="w-5 h-5 text-orange-500" />;
      case "SYSTEM":
      case "ADMIN":
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationUrl = (notification: AppNotification) => {
    if (notification.link) return notification.link;
    return "#";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Thông báo"
      >
        <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-slate-900"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl overflow-hidden z-50",
              "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10"
            )}
          >
            {/* Push Notification Promo */}
            {!pushEnabled && typeof window !== "undefined" && "Notification" in window && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-500/10">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <Bell className="w-4 h-4 animate-bounce" />
                  <span className="text-xs font-semibold">Bật thông báo đẩy</span>
                </div>
                <button
                  onClick={handleEnablePush}
                  className="px-3 py-1 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-full transition-colors"
                >
                  Bật ngay
                </button>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden soft-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.slice(0, 20).map((notif) => (
                    <Link
                      key={notif.id}
                      href={getNotificationUrl(notif)}
                      onClick={(e) => {
                        markAsRead(notif.id);
                        if (!notif.link) {
                          e.preventDefault();
                        } else {
                          setIsOpen(false);
                        }
                      }}
                      className={cn(
                        "flex items-start gap-4 p-4 border-b border-gray-100 dark:border-white/5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80 group",
                        !notif.isRead && "bg-primary/5 dark:bg-primary/10"
                      )}
                    >
                      <div className="shrink-0 mt-1">
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-full",
                          "bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform duration-300"
                        )}>
                          {getIcon(notif.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium leading-tight mb-1",
                          notif.isRead ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 shrink-0 flex items-center justify-center mt-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Bạn chưa có thông báo nào</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Khi có thông báo mới, chúng sẽ xuất hiện ở đây.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
