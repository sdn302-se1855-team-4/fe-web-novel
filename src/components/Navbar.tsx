"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sun,
  Moon,
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchParams = useSearchParams();


  const genreRef = useRef<HTMLDivElement>(null);
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
        setUserProfile(prev => ({ 
          ...prev, 
          ...e.detail,
          id: prev?.id || e.detail.id,
          username: prev?.username || e.detail.username
        } as UserProfile));
      } else {
        fetchUserProfile();
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate as EventListener);
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
        const res = await apiFetch<{ data: SearchSuggestion[] }>(`/stories?search=${encodeURIComponent(searchQuery)}&limit=5`);
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
      // Close search suggestions on click outside
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
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
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-all">
                <BookOpen size={20} />
              </div>
              <span className="text-lg font-bold text-text-primary group-hover:text-emerald-500 transition-colors">
                BestNovelVN
              </span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-surface-elevated text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-inner border border-emerald-500/20"
              title="Chế độ tối/sáng"
            >
                {theme === 'dark' ? <Lightbulb size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                className="w-full pl-4 pr-10 py-2 bg-surface-elevated border border-border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted transition-all focus:border-emerald-500/50"
                placeholder="Bạn muốn tìm truyện gì..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-brand">
                <Search size={18} strokeWidth={2.5} />
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && (searchQuery.length >= 2) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface-brand border border-border-brand rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  <div className="p-2">
                    {isSearching ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-text-muted text-xs">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full" />
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
                                src={story.coverImage || "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop"}
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop")}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-emerald-500 transition-colors">
                                {story.title}
                              </h4>
                              <p className="text-[10px] text-text-muted truncate">
                                {story.author?.displayName || story.author?.username || "Ẩn danh"}
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
          <div className="flex items-center justify-end gap-2 lg:gap-4 shrink-0 lg:flex-1">

            {loggedIn && (
              <button className="p-2 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-full transition-all">
                <Bell size={20} />
              </button>
            )}

            {loggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-brand hover:border-emerald-500/50 transition-all"
                  onClick={() => setUserMenuOpen((p) => !p)}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 overflow-hidden">
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={14} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-text-primary hidden sm:block">
                    {userProfile?.displayName || userProfile?.username || "Me"}
                  </span>
                  <ChevronDown size={12} className={cn("text-text-muted transition-transform", userMenuOpen && "rotate-180")} />
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
                      <button className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/5 flex items-center gap-3" onClick={handleLogout}>
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/register" className="px-4 py-2 text-xs font-bold text-white bg-secondary-brand hover:brightness-110 rounded-lg transition-all shadow-md">
                  Đăng ký
                </Link>
                <Link href="/login" className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all shadow-md">
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
      <nav className="bg-emerald-500 h-[44px] flex items-center shadow-md dark:bg-surface-elevated border-b border-emerald-400/20 dark:border-border-brand transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4 lg:gap-8 w-full">
          <Link
            href="/"
            className={cn(
              "text-sm font-bold transition-all uppercase tracking-tight font-sans",
              "text-white hover:text-white/90 dark:text-text-primary dark:hover:text-emerald-500",
              pathname === "/" && "underline decoration-2 underline-offset-4"
            )}
          >
            Trang chủ
          </Link>

          {/* Thể Loại Dropdown */}
          <div className="relative" ref={genreRef}>
            <button
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-all uppercase tracking-tight font-sans",
                "text-white hover:text-white/90 dark:text-text-primary dark:hover:text-emerald-500",
                genreOpen && "underline decoration-2 underline-offset-4"
              )}
              onClick={() => {
                setGenreOpen((p) => !p);
              }}
            >
              Thể Loại
              <ChevronDown size={14} className={cn("transition-transform", genreOpen && "rotate-180")} />
            </button>
          </div>


          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              className={cn(
                "hidden sm:block text-sm font-bold transition-all uppercase tracking-tight font-sans",
                "text-white/90 hover:text-white dark:text-text-secondary dark:hover:text-emerald-500",
                pathname === link.href && "text-white underline decoration-2 underline-offset-4"
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
                {genres.map(g => (
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
            className="md:hidden fixed inset-0 top-[108px] z-40 bg-surface-brand/95 backdrop-blur-xl transition-all"
          >
            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-108px)]">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 mb-2">Điều hướng</span>
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-elevated hover:text-emerald-500 transition-all text-lg font-medium">Trang chủ</Link>
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
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 mb-2">Tài khoản</span>
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
