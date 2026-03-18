"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Sonner Toaster positioned at bottom-right, synced with next-themes.
 * Used exclusively for incoming notification toasts.
 * Regular app toasts (success/error) use the existing Toast component.
 */
export function NotificationToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors={false}
      duration={5000}
      toastOptions={{
        style: {
          fontFamily: "inherit",
          fontSize: "0.9375rem",
        },
      }}
    />
  );
}
