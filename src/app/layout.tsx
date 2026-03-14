"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isChapterPage = pathname.includes("/stories/") && pathname.includes("/chapters/");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {!isAuthPage && !isChapterPage && <Navbar />}
            <main className={cn(
              "min-h-screen",
              (!isAuthPage && !isChapterPage) && "pt-[var(--navbar-height)]"
            )}>
              {children}
            </main>
            {!isAuthPage && !isChapterPage && <Footer />}
            <ScrollToTop />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
