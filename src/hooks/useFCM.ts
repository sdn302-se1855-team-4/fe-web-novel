"use client";

import { useState, useEffect, useCallback } from "react";
import { onMessage } from "firebase/messaging";
import { getFirebaseMessaging, requestFCMToken } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

/**
 * Manages Firebase Cloud Messaging for push notifications.
 *
 * - Registers the service worker on mount (enables background push)
 * - Sets up a foreground message handler when the user is logged in
 * - Exposes `pushEnabled` state and `registerToken()` to request permission
 */
export function useFCM() {
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    // Read current permission state (deferred to avoid SSR mismatch)
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }

    // Register SW early so it's ready before the user clicks "Enable"
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .catch(() => {
          // Registration failure is non-fatal — getToken will retry
        });
    }

    if (!isLoggedIn()) return;

    // Show browser notification for foreground FCM messages
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        if (Notification.permission !== "granted") return;
        if (!payload.notification?.title) return;

        new Notification(payload.notification.title, {
          body: payload.notification.body ?? "",
          data: payload.data,
        });
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, []);

  /**
   * Request notification permission, obtain FCM token, and save it to
   * the backend. Returns true on success, false if denied or on error.
   */
  const registerToken = useCallback(async (): Promise<boolean> => {
    const token = await requestFCMToken();
    if (!token) return false;

    try {
      await apiFetch("/notifications/fcm-token", {
        method: "POST",
        body: JSON.stringify({ token, device: navigator.userAgent }),
      });
      setPushEnabled(true);
      return true;
    } catch {
      // Backend save failed but browser permission was granted — still mark enabled
      setPushEnabled(Notification.permission === "granted");
      return false;
    }
  }, []);

  return { pushEnabled, registerToken };
}
