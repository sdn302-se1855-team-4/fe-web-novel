export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  // We use compat libraries for Service Worker because it's easier and smaller for SW script
  const scriptContent = `
    importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js");

    const firebaseConfig = {
      apiKey: "${apiKey}",
      authDomain: "${authDomain}",
      projectId: "${projectId}",
      storageBucket: "${storageBucket}",
      messagingSenderId: "${messagingSenderId}",
      appId: "${appId}"
    };

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log("[firebase-messaging-sw.js] Received background message ", payload);
      
      const notificationTitle = payload.notification?.title || "Thông báo mới";
      const notificationOptions = {
        body: payload.notification?.body || "",
        icon: "/favicon.ico", // You can replace this with your app's icon
        badge: "/favicon.ico",
        data: payload.data, // For handling clicks
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    // Handle click on background notification
    self.addEventListener('notificationclick', function(event) {
      event.notification.close();
      const clickAction = event.notification.data?.link || '/';
      
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(clickAction);
          }
        })
      );
    });
  `;

  return new Response(scriptContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
