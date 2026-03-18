"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onMessage } from "firebase/messaging";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { apiFetch } from "@/lib/api";
import { getAccessToken, isLoggedIn } from "@/lib/auth";
import { getFirebaseMessaging } from "@/lib/firebase";

export interface Notification {
  id: string;
  type: "NEW_CHAPTER" | "NEW_COMMENT" | "NEW_REVIEW" | "NEW_FOLLOWER" | "DONATION_RECEIVED" | "SYSTEM" | "ADMIN";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string, e?: React.MouseEvent) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInitialNotifications = useCallback(async () => {
    try {
      // Fetch the first 20 notifications
      const res = await apiFetch<unknown>("/notifications?page=1&limit=20");
      
      let items: Notification[] = [];
      if (res && typeof res === 'object') {
        const r = res as Record<string, unknown>;
        if (Array.isArray(r.items)) {
          items = r.items as Notification[];
        } else if (Array.isArray(res)) {
          items = res as Notification[];
        } else if (Array.isArray(r.data)) {
          items = r.data as Notification[];
        }
      }

      setNotifications(items);
      setUnreadCount(items.filter((n: Notification) => !n.isRead).length);
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const connectSSE = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    
    // Use Microsoft's fetch-event-source to pass the Authorization header
    fetchEventSource(`${API_BASE}/notifications/stream`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onmessage(ev) {
        if (ev.data) {
          try {
            const newNotification = JSON.parse(ev.data);
            setNotifications((prev) => {
              // Check if notification already exists to prevent duplicates
              if (prev.find((n) => n.id === newNotification.id)) return prev;
              
              // Only keep the most recent 50 notifications in memory
              const updated = [newNotification, ...prev].slice(0, 50);
              setUnreadCount(updated.filter((n) => !n.isRead).length);
              return updated;
            });
          } catch (e) {
            console.error("Failed to parse SSE notification", e);
          }
        }
      },
      onerror(err) {
        console.error("SSE Error:", err);
        // Throwing an error stops the internal retry mechanism if it's a fatal error
        // Keeping it silent will allow it to retry automatically
      },
    });
  }, []);

  useEffect(() => {
    // Register FCM service worker (needed for background push notifications)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .catch((err) => console.error("FCM SW registration failed:", err));
    }

    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    fetchInitialNotifications().then(() => {
      connectSSE();
    });

    // Foreground FCM message handler — show browser notification when app is open
    let unsubscribeFCM: (() => void) | undefined;
    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      unsubscribeFCM = onMessage(messaging, (payload) => {
        if (Notification.permission === "granted" && payload.notification?.title) {
          new Notification(payload.notification.title, {
            body: payload.notification.body ?? "",
            data: payload.data,
          });
        }
      });
    })();

    return () => {
      unsubscribeFCM?.();
    };
  }, [fetchInitialNotifications, connectSSE]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // Prevent multiple requests if already read locally
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;

    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
    } catch {
      // Revert if failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic Update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const previousUnread = unreadCount;
    setUnreadCount(0);

    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
    } catch {
      // Revert if failed (simple revert logic)
      setUnreadCount(previousUnread);
      fetchInitialNotifications(); // best to re-fetch if read-all fails
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
