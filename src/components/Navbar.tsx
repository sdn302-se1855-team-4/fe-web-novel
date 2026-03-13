"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Sun,
  Moon,
  Menu,
  X,
  Library,
  User,
  LogOut,
  Pen,
  Shield,
  Search,
  Clock,
  ChevronDown,
  Wallet,
  Bell,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { isLoggedIn, removeTokens, getUserRole } from "@/lib/auth";
import { useState, useEffect, useRef, FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Genre {
  id: string;
  name: string;
}

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const genreRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoggedIn(isLoggedIn());
      setRole(getUserRole() || null);
    });
  }, [pathname]);

  useEffect(() => {
    apiFetch<Genre[]>("/stories/genres")
      .then((res) => setGenres(res))
      .catch(() => {});
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!isLoggedIn()) return;
    apiFetch<{ data: Notification[]; unreadCount: number }>(
      "/notifications?limit=5",
    )
      .then((res) => {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {});
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setGenreOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeTokens();
    setLoggedIn(false);
    setUserMenuOpen(false);
    router.push("/");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stories?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      //
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  // User dropdown items
  const userMenuItems = [
    { href: "/profile", label: "Hồ sơ", icon: <User size={16} /> },
    { href: "/library", label: "Thư viện", icon: <Library size={16} /> },
    { href: "/history", label: "Lịch sử đọc", icon: <Clock size={16} /> },
    { href: "/wallet", label: "Ví xu", icon: <Wallet size={16} /> },
  ];
  if (role === "WRITER" || role === "ADMIN") {
    userMenuItems.push({
      href: "/studio",
      label: "Viết truyện",
      icon: <Pen size={16} />,
    });
  }
  if (role === "ADMIN") {
    userMenuItems.push({
      href: "/admin",
      label: "Quản trị",
      icon: <Shield size={16} />,
    });
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <nav className="bg-[#020617]/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group transition-all duration-300">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
              <BookOpen size={24} />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors hidden sm:block">
              BestNovelVN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {/* Genre Dropdown */}
            <div className="relative" ref={genreRef}>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full",
                  genreOpen 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
                onClick={() => setGenreOpen((p) => !p)}
              >
                Thể loại
                <ChevronDown
                  size={14}
                  className={cn("transition-transform duration-200", genreOpen && "rotate-180")}
                />
              </button>
              
              {genreOpen && (
                <div className="absolute top-full left-0 mt-4 w-96 p-4 bg-surface-brand/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/stories"
                      className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 hover:text-emerald-400 text-slate-300"
                      onClick={() => setGenreOpen(false)}
                    >
                      Tất cả truyện
                    </Link>
                    {genres.map((g) => (
                      <Link
                        key={g.id}
                        href={`/stories?genre=${g.id}`}
                        className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 hover:text-emerald-400 text-slate-300"
                        onClick={() => setGenreOpen(false)}
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/"
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full",
                pathname === "/" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              Trang chủ
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:relative lg:block max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300"
              placeholder="Tìm kiếm truyện/tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {loggedIn && (
              <div className="relative" ref={notifRef}>
                <button
                  className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 relative"
                  onClick={() => setNotifOpen((p) => !p)}
                  aria-label="Thông báo"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-bg-brand">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                
                {notifOpen && (
                  <div className="absolute top-full right-0 mt-4 w-80 bg-surface-brand/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Thông báo</span>
                      {unreadCount > 0 && (
                        <button
                          className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                          onClick={markAllRead}
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer",
                              !n.isRead && "bg-emerald-500/5 border-l-2 border-l-emerald-500"
                            )}
                          >
                            <p className="text-xs text-slate-100 leading-relaxed mb-1">{n.message}</p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500 italic text-sm">
                          Không có thông báo mới
                        </div>
                      )}
                    </div>
                    <Link
                      href="/notifications"
                      className="block p-3 text-center text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      onClick={() => setNotifOpen(false)}
                    >
                      Xem tất cả thông báo
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <button
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* User Avatar Dropdown */}
            {loggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300"
                  onClick={() => setUserMenuOpen((p) => !p)}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <User size={18} />
                  </div>
                  <ChevronDown
                    size={12}
                    className={cn("text-slate-500 transition-transform duration-200", userMenuOpen && "rotate-180")}
                  />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-4 w-56 bg-surface-brand/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="text-slate-400 group-hover:text-emerald-400">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                    <div className="my-2 border-t border-white/5" />
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg shadow-emerald-900/20 transition-all duration-300"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="p-2.5 md:hidden rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-18 bottom-0 z-40 bg-bg-brand/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 space-y-6">
              <form onSubmit={handleSearch} className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Tìm kiếm truyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Điều hướng</span>
                <Link
                  href="/"
                  className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-lg font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Trang chủ
                </Link>
                
                <div className="pt-4 pb-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Thể loại hot</span>
                  <div className="grid grid-cols-2 gap-2 px-4">
                    {genres.slice(0, 10).map((g) => (
                      <Link
                        key={g.id}
                        href={`/stories?genre=${g.id}`}
                        className="px-3 py-2 rounded-lg bg-white/5 text-xs text-slate-400 text-center hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
                        onClick={() => setMobileOpen(false)}
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {loggedIn && (
                <div className="pt-6 space-y-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Tài khoản</span>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="text-slate-500">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  <button 
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all" 
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </div>
              )}
              
              {!loggedIn && (
                <div className="px-4 pt-4">
                  <Link
                    href="/login"
                    className="block w-full py-4 bg-emerald-600 text-white text-center font-bold rounded-xl shadow-lg shadow-emerald-900/20"
                    onClick={() => setMobileOpen(false)}
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
