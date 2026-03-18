import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Serves the Firebase Cloud Messaging service worker dynamically
 * so environment variables are injected at runtime (no hardcoded values).
 *
 * URL: /firebase-messaging-sw.js
 * Scope: / (controls all pages — granted by Service-Worker-Allowed header)
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const script = `
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

// Handle push messages received while app is in background / closed
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Thông báo mới';
  self.registration.showNotification(title, {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data || {},
  });
});

// Navigate to link when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  if (!link) return;
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        const existing = list.find((c) => c.url === link && 'focus' in c);
        return existing ? existing.focus() : clients.openWindow(link);
      })
  );
});
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
