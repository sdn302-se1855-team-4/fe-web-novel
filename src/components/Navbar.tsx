"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sun,
  Menu,
  X,
  Library,
  User as UserIcon,
  LogOut,
  Pen,
  Shield,
  Search,
  Clock,
  ChevronDown,
  Wallet,
  Bell,
  Lightbulb,
  Gift,
} from "lucide-react";
import Logo from "./Logo";
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

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

interface SearchSuggestion {
  id: string;
  title: string;
  coverImage?: string;
  author?: {
    displayName?: string;
    username?: string;
  };
  genres?: { name: string }[];
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
  const [rankOpen, setRankOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const rankTabs = [
    { key: "day", label: "Top Ngày" },
    { key: "week", label: "Top Tuần" },
    { key: "month", label: "Top Tháng" },
  ];

  const genreRef = useRef<HTMLDivElement>(null);
  const rankRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoggedIn(isLoggedIn());
      setRole(getUserRole() || null);
    });
  }, [pathname]);

  const fetchUserProfile = () => {
    if (!isLoggedIn()) return;
    apiFetch<UserProfile>("/auth/profile")
      .then((res) => setUserProfile(res))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUserProfile();
  }, [loggedIn]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setUserProfile(
          (prev) =>
            ({
              ...prev,
              ...e.detail,
              id: prev?.id || e.detail.id,
              username: prev?.username || e.detail.username,
            }) as UserProfile,
        );
      } else {
        fetchUserProfile();
      }
    };
    window.addEventListener(
      "user-profile-updated",
      handleProfileUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "user-profile-updated",
        handleProfileUpdate as EventListener,
      );
  }, []);

  useEffect(() => {
    apiFetch<Genre[]>("/stories/genres")
      .then((res) => setGenres(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowSuggestions(true);
      try {
        const res = await apiFetch<{ data: SearchSuggestion[] }>(
          `/stories?search=${encodeURIComponent(searchQuery)}&limit=5`,
        );
        setSuggestions(res.data || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      if (rankRef.current && !rankRef.current.contains(e.target as Node)) {
        setRankOpen(false);
      }
      // Close search suggestions on click outside
      setShowSuggestions(false);
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

  const userMenuItems = [
    { href: "/profile", label: "Hồ sơ", icon: <UserIcon size={16} /> },
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

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  const navLinks = [
    { href: "/stories?search=", label: "Tìm truyện" },
    { href: "/history", label: "Lịch sử" },
    { href: "/library", label: "Theo dõi" },
    { href: "https://discord.gg", label: "Discord", external: true },
    { href: "https://facebook.com", label: "Fanpage", external: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Search & Auth */}
      <div className="bg-surface-brand border-b border-border-brand/50 h-[64px] flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between w-full gap-4 lg:gap-8">
          {/* Logo & Theme */}
          <div className="flex items-center gap-3 shrink-0 lg:flex-1">
            <Link href="/" className="shrink-0 group">
              <Logo showTagline={false} className="sm:hidden" iconSize={24} />
              <Logo showTagline={true} className="hidden sm:flex" iconSize={24} />
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-surface-elevated text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-inner border border-emerald-500/20 shrink-0"
              title="Chế độ tối/sáng"
            >
              {theme === "dark" ? <Lightbulb size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div className="flex-1 max-w-xl relative hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                className="w-full pl-4 pr-10 py-2 bg-surface-elevated border border-border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted transition-all focus:border-emerald-500/50"
                placeholder="Bạn muốn tìm truyện gì..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() =>
                  searchQuery.length >= 2 && setShowSuggestions(true)
                }
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-brand"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && searchQuery.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface-brand border border-border-brand rounded-xl shadow-2xl overflow-hidden z-100"
                >
                  <div className="p-2">
                    {isSearching ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-text-muted text-xs">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
                        />
                        Đang tìm kiếm...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="space-y-1">
                        {suggestions.map((story) => (
                          <Link
                            key={story.id}
                            href={`/stories/${story.id}`}
                            className="flex items-center gap-3 p-2 hover:bg-surface-elevated rounded-lg transition-colors group"
                            onClick={() => setShowSuggestions(false)}
                          >
                            <div className="w-10 h-14 rounded-md overflow-hidden bg-surface-elevated shrink-0 border border-border-brand/50">
                              <img
                                src={
                                  story.coverImage ||
                                  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop"
                                }
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) =>
                                  (e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop")
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-emerald-500 transition-colors">
                                {story.title}
                              </h4>
                              <p className="text-[10px] text-text-muted truncate">
                                {story.author?.displayName ||
                                  story.author?.username ||
                                  "Ẩn danh"}
                              </p>
                              {story.genres && story.genres.length > 0 && (
                                <span className="text-[9px] text-emerald-500/80 font-medium">
                                  {story.genres[0].name}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                        <Link
                          href={`/stories?search=${encodeURIComponent(searchQuery)}`}
                          className="block text-center py-2 text-[11px] font-bold text-emerald-500 hover:bg-emerald-500/5 transition-colors border-t border-border-brand/50 mt-1"
                          onClick={() => setShowSuggestions(false)}
                        >
                          Xem tất cả kết quả
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-text-muted text-xs">
                        Không tìm thấy kết quả nào
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-4 shrink-0 lg:flex-1">
            {/* Mobile Search Button */}
            <button 
              className="p-2 md:hidden text-text-muted hover:text-emerald-500 transition-all"
              onClick={() => {
                setMobileOpen(true);
                // We could add a separate search bar in mobile menu or show an overlay
              }}
            >
              <Search size={22} />
            </button>
            {loggedIn && (
              <button className="p-2 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-full transition-all hidden xs:flex">
                <Bell size={20} />
              </button>
            )}

            {loggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-lg bg-surface-elevated border border-border-brand hover:border-emerald-500/50 transition-all"
                  onClick={() => setUserMenuOpen((p) => !p)}
                >
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 overflow-hidden shrink-0">
                    {userProfile?.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon size={14} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-text-primary hidden lg:block max-w-[80px] truncate">
                    {userProfile?.displayName || userProfile?.username || "Me"}
                  </span>
                  <ChevronDown
                    size={12}
                    className={cn(
                      "text-text-muted transition-transform hidden sm:block",
                      userMenuOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-surface-brand border border-border-brand rounded-xl shadow-xl overflow-hidden py-1 z-50"
                    >
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-elevated hover:text-emerald-500"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-border-brand my-1" />
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/5 flex items-center gap-3"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-secondary-brand hover:brightness-110 rounded-lg transition-all shadow-md"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all shadow-md"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
            <button
              className="p-2 md:hidden rounded-full text-text-muted hover:text-emerald-500 transition-all"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Nav Row - Links Centered */}
      <nav className="bg-emerald-500 h-[38px] sm:h-[44px] flex items-center shadow-md dark:bg-surface-elevated border-b border-emerald-400/20 dark:border-border-brand transition-colors duration-300 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-start sm:justify-center gap-5 sm:gap-8 w-full min-w-max">
          <Link
            href="/"
            className={cn(
              "text-[12px] sm:text-sm font-bold transition-all uppercase tracking-tight font-sans whitespace-nowrap",
              "text-white hover:text-white/90 dark:text-text-primary dark:hover:text-emerald-500",
              pathname === "/" && "underline decoration-2 underline-offset-4",
            )}
          >
            Trang chủ
          </Link>

          {/* Thể Loại Dropdown */}
          <div className="relative" ref={genreRef}>
            <button
              className={cn(
                "flex items-center gap-1.5 text-[13px] sm:text-sm font-bold transition-all uppercase tracking-tight font-sans whitespace-nowrap",
                "text-white hover:text-white/90 dark:text-text-primary dark:hover:text-emerald-500",
                genreOpen && "underline decoration-2 underline-offset-4",
              )}
              onClick={() => {
                setGenreOpen((p) => !p);
                setRankOpen(false);
              }}
            >
              Thể Loại
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  genreOpen && "rotate-180",
                )}
              />
            </button>
          </div>

          {/* Xếp Hạng Dropdown */}
          <div className="relative" ref={rankRef}>
            <button
              className={cn(
                "flex items-center gap-1.5 text-[13px] sm:text-sm font-bold transition-all uppercase tracking-tight font-sans whitespace-nowrap",
                "text-white hover:text-white/90 dark:text-text-primary dark:hover:text-emerald-500",
                (pathname.startsWith("/rankings") || rankOpen) &&
                  "underline decoration-2 underline-offset-4",
              )}
              onClick={() => {
                setRankOpen((p) => !p);
                setGenreOpen(false);
              }}
            >
              Xếp hạng
              <ChevronDown
                size={14}
                className={cn("transition-transform", rankOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {rankOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-surface-brand border border-border-brand rounded-2xl shadow-2xl overflow-hidden py-2 z-50 px-1"
                >
                  {rankTabs.map((tab) => (
                    <Link
                      key={tab.key}
                      href={`/rankings/${tab.key}`}
                      className={cn(
                        "flex items-center justify-center py-3 text-sm font-bold transition-all rounded-xl my-0.5",
                        pathname === `/rankings/${tab.key}`
                          ? "text-emerald-500 bg-emerald-500/5"
                          : "text-text-secondary hover:text-emerald-500 hover:bg-surface-elevated",
                      )}
                      onClick={() => setRankOpen(false)}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              className={cn(
                "hidden sm:block text-sm font-bold transition-all uppercase tracking-tight font-sans",
                "text-white/90 hover:text-white dark:text-text-secondary dark:hover:text-emerald-500",
                pathname === link.href &&
                  "text-white underline decoration-2 underline-offset-4",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Thể Loại Mega Menu */}
      <AnimatePresence>
        {genreOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-surface-brand border-b border-border-brand shadow-xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-3">
                <Link
                  href="/stories"
                  className="text-[13px] font-medium text-text-muted hover:text-emerald-500 transition-colors py-1"
                  onClick={() => setGenreOpen(false)}
                >
                  Tất cả
                </Link>
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/stories?genre=${g.id}`}
                    className="text-[13px] font-medium text-text-muted hover:text-emerald-500 transition-colors py-1 truncate"
                    onClick={() => setGenreOpen(false)}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-[64px] z-40 bg-surface-brand/95 backdrop-blur-xl transition-all"
          >
            <div className="p-4 space-y-6 overflow-y-auto h-full">
              {/* Search in Mobile Menu */}
              <div className="relative group">
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-surface-elevated border border-border-brand rounded-2xl text-base text-text-primary placeholder:text-text-muted outline-none focus:ring-2 ring-emerald-500/20"
                    placeholder="Tìm truyện, tác giả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                </form>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 mb-2">
                  Điều hướng
                </span>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-elevated hover:text-emerald-500 transition-all text-lg font-medium"
                >
                  Trang chủ
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-elevated hover:text-emerald-500 transition-all text-lg font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {loggedIn && (
                <div className="pt-4 space-y-1">
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 mb-2">
                    Tài khoản
                  </span>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-elevated hover:text-emerald-500 transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
