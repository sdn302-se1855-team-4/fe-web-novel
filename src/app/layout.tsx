"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isReaderPage = /^\/stories\/[^\/]+\/chapters\/[^\/]+$/.test(pathname);
  const isAdminPage = pathname.startsWith("/admin");
  const isStudioPage = pathname.startsWith("/studio");
  
  const hideNavbar = isAuthPage || isReaderPage || isAdminPage || isStudioPage;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {!hideNavbar && <Navbar />}
            <NotificationProvider>
              <main className={cn(
                "min-h-screen",
                !hideNavbar && "pt-(--navbar-height)"
              )}>
                {children}
              </main>
            </NotificationProvider>
            {!hideNavbar && <Footer />}
            <ScrollToTop />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
