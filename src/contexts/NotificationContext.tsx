"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getAccessToken, isLoggedIn } from "@/lib/auth";

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
  const [loading, setLoading] = useState(true);
  const [authVersion, setAuthVersion] = useState(0);

  // Re-initialize whenever the user logs in (setTokens dispatches "auth:login")
  useEffect(() => {
    const handleLogin = () => setAuthVersion((v) => v + 1);
    window.addEventListener("auth:login", handleLogin);
    return () => window.removeEventListener("auth:login", handleLogin);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

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
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const connectSSE = useCallback(() => {
    const token = getAccessToken();
    if (!token) return null;

    const ctrl = new AbortController();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    fetchEventSource(`${API_BASE}/notifications/stream`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(ev) {
        if (!ev.data) return;
        try {
          const raw = JSON.parse(ev.data);
          // NestJS global TransformInterceptor wraps every SSE emission:
          //   { data: <notification>, status: 200, message: "success" }
          // If the notification id is not at root level, unwrap one level.
          const newNotification: Notification = raw?.id ? raw : (raw?.data as Notification);
          if (!newNotification?.id) return;

          setNotifications((prev) => {
            if (prev.find((n) => n.id === newNotification.id)) return prev;
            return [newNotification, ...prev].slice(0, 50);
          });
          toast(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        } catch (e) {
          console.error("Failed to parse SSE notification", e);
        }
      },
      onerror(err) {
        console.error("SSE Error:", err);
        // Returning void (not throwing) lets the library retry automatically
      },
    });

    return ctrl;
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    let ctrl: AbortController | null = null;

    fetchInitialNotifications().then(() => {
      if (!cancelled) {
        ctrl = connectSSE();
      }
    });

    return () => {
      cancelled = true;
      ctrl?.abort();
    };
  }, [fetchInitialNotifications, connectSSE, authVersion]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // Prevent multiple requests if already read locally
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;

    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
    } catch {
      // Revert if failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic Update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
    } catch {
      // Revert by re-fetching the real state
      fetchInitialNotifications();
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
