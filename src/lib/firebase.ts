import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getMessaging, getToken, deleteToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent duplicate initialization in dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Get Firebase Messaging instance (null if unsupported)
export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

// Request FCM Token — uses existing SW registration if available
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Trình duyệt không hỗ trợ Web Push Notifications");
      return null;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error("NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set");
        return null;
      }

      // Register static SW file explicitly
      let swReg: ServiceWorkerRegistration | undefined;
      if ("serviceWorker" in navigator) {
        swReg = await navigator.serviceWorker
          .register("/firebase-messaging-sw.js", { scope: "/" })
          .catch(() => undefined);
      }

      // Clear any stale push subscription before requesting a new token
      try {
        await deleteToken(messaging);
        if (swReg) {
          const oldSub = await swReg.pushManager.getSubscription();
          if (oldSub) await oldSub.unsubscribe();
        }
      } catch {
        // Ignore — no existing token/subscription to clear
      }

      const currentToken = await getToken(messaging, {
        vapidKey,
        ...(swReg && { serviceWorkerRegistration: swReg }),
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.warn("Không thể lấy FCM token");
        return null;
      }
    } else {
      console.warn("Người dùng từ chối quyền gửi thông báo");
      return null;
    }
  } catch (err) {
    console.error("Lỗi khi xin cấp quyền FCM:", err);
    return null;
  }
}

/**
 * Opens Google sign-in popup and returns the Firebase idToken.
 */
export async function signInWithGoogle(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return idToken;
}

export { auth };
