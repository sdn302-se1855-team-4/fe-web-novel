"use client";

import Link from "next/link";
import Image from "next/image";
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
  ChevronDown,
  Wallet,
  Lightbulb,
  Clock,
  Shield,
  Search,
} from "lucide-react";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import { useTheme } from "./ThemeProvider";
import { isLoggedIn, removeTokens, getUserRole } from "@/lib/auth";
import { useState, useEffect, useRef, FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { cn, removeAccents } from "@/lib/utils";

interface Genre {
  id: string;
  name: string;
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
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);


  const genreRef = useRef<HTMLDivElement>(null);
  const genrePanelRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoggedIn(isLoggedIn());
      setRole(getUserRole() || null);
    });
  }, [pathname]);

  const fetchUserProfile = () => {
    if (!isLoggedIn()) return;
    apiFetch<UserProfile>("/users/me")
      .then((res) => setUserProfile(res))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUserProfile();
  }, [loggedIn]);

  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent<{ avatar?: string; displayName?: string; id?: string; username?: string }>) => {
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
        // Fetch more than needed to allow client-side filtering if backend results are imperfect
        const res = await apiFetch<{ data: SearchSuggestion[] }>(
          `/stories?search=${encodeURIComponent(removeAccents(searchQuery))}&limit=20`,
        );
        
        const normalizedQuery = removeAccents(searchQuery.toLowerCase());
        const filtered = (res.data || []).filter(story => {
          const normalizedTitle = removeAccents(story.title.toLowerCase());
          const normalizedUsername = removeAccents((story.author?.username || "").toLowerCase());
          const normalizedDisplayName = removeAccents((story.author?.displayName || "").toLowerCase());
          
          return normalizedTitle.includes(normalizedQuery) || 
                 normalizedUsername.includes(normalizedQuery) || 
                 normalizedDisplayName.includes(normalizedQuery);
        });

        setSuggestions(filtered.slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Notifications logic removed as unused in UI
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        genreRef.current && !genreRef.current.contains(e.target as Node) &&
        genrePanelRef.current && !genrePanelRef.current.contains(e.target as Node)
      ) {
        setGenreOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
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
      router.push(`/stories?search=${encodeURIComponent(removeAccents(searchQuery.trim()))}`);
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
          {/* Logo & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="shrink-0 group">
              <Logo showTagline={false} className="sm:hidden" iconSize={26} />
              <Logo
                showTagline={true}
                className="hidden sm:flex"
                iconSize={28}
              />
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-full bg-surface-elevated text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/10 shrink-0"
              aria-label="Toggle Theme"
              suppressHydrationWarning
            >
              {(mounted && theme === "dark") ? (
                <Lightbulb size={18} />
              ) : (
                <Sun size={18} />
              )}
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
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-brand"
                suppressHydrationWarning
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
                            <div className="w-10 h-14 rounded-md overflow-hidden bg-surface-elevated shrink-0 border border-border-brand/50 relative">
                              <Image
                                src={
                                  story.coverImage ||
                                  "https://images.unsplash.com/photo-1543005127-b6b197e60be2?q=80&w=400&auto=format&fit=crop"
                                }
                                alt={story.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                unoptimized
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
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {loggedIn && <NotificationBell />}

            {loggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-surface-elevated border border-border-brand hover:border-emerald-500/50 transition-all"
                  onClick={() => setUserMenuOpen((p) => !p)}
                >
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 overflow-hidden shrink-0 border border-emerald-500/10">
                    {userProfile?.avatar ? (
                      <div className="w-full h-full relative">
                        <Image
                          src={userProfile.avatar}
                          alt="Avatar"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <UserIcon size={14} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-text-primary hidden md:block max-w-[80px] truncate">
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
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full right-0 mt-3 w-52 bg-surface-brand border border-border-brand rounded-2xl shadow-2xl overflow-hidden py-1.5 z-100"
                    >
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-emerald-500 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-border-brand/50 my-1.5 mx-2" />
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/5 flex items-center gap-3 transition-colors"
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
              <div className="flex items-center gap-1.5 sm:gap-3">
                <Link
                  href="/login"
                  className="px-3 sm:px-5 py-2 text-[11px] sm:text-xs font-bold text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/5 rounded-xl transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-3 sm:px-5 py-2 text-[11px] sm:text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hidden xs:block"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            <button
              className="p-2 md:hidden rounded-xl text-text-muted hover:text-emerald-500 transition-all bg-surface-elevated border border-border-brand"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Nav Row - Links Centered - Hidden on Mobile */}
      <div className="hidden md:block">
        <nav className="bg-emerald-500 h-[44px] flex items-center shadow-md dark:bg-surface-elevated border-b border-emerald-400/20 dark:border-border-brand px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 w-full">
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
                onClick={() => setGenreOpen((p) => !p)}
                suppressHydrationWarning
              >
                Thể loại
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform",
                    genreOpen && "rotate-180",
                  )}
                />
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
                  pathname === link.href &&
                    "text-white underline decoration-2 underline-offset-4",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Thể Loại Mega Menu */}
      <AnimatePresence>
        {genreOpen && (
          <motion.div
            ref={genrePanelRef}
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-60 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 right-0 w-[85%] max-w-[360px] z-70 bg-surface-brand shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-border-brand flex items-center justify-between">
                <Logo showTagline={false} iconSize={26} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl bg-surface-elevated text-text-muted transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-8">
                {/* Search in Mobile Menu */}
                <div className="space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500 px-1">
                    Tìm kiếm truyện
                  </span>
                  <form onSubmit={handleSearch} className="relative group">
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-surface-elevated border border-border-brand rounded-2xl text-base text-text-primary placeholder:text-text-muted outline-none focus:ring-2 ring-emerald-500/20 transition-all"
                      placeholder="Tác giả, tên truyện..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors"
                      size={20}
                    />
                  </form>
                </div>

                {/* Primary Nav */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500 px-1">
                    Khám phá
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold",
                        pathname === "/"
                          ? "bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/5"
                          : "text-text-primary hover:bg-surface-elevated",
                      )}
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                        <Logo iconSize={18} showTagline={false} />
                      </div>
                      Trang chủ
                    </Link>

                    {/* Genres Mobile Expandable */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setGenreOpen(!genreOpen)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-text-primary hover:bg-surface-elevated font-bold transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <BookOpen size={18} />
                          </div>
                          Thể loại
                        </div>
                        <ChevronDown
                          size={18}
                          className={cn(
                            "transition-transform",
                            genreOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <AnimatePresence>
                        {genreOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden grid grid-cols-2 gap-2 px-2 py-2 bg-surface-elevated/50 rounded-2xl"
                          >
                            <Link
                              href="/stories"
                              className="text-sm font-medium p-3 rounded-xl hover:text-emerald-500 bg-surface-brand/50 text-center transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              Tất cả
                            </Link>
                            {genres.slice(0, 15).map((g) => (
                              <Link
                                key={g.id}
                                href={`/stories?genre=${g.id}`}
                                className="text-sm font-medium p-3 rounded-xl hover:text-emerald-500 bg-surface-brand/50 text-center transition-colors truncate"
                                onClick={() => setMobileOpen(false)}
                              >
                                {g.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Regular Links */}
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-text-primary hover:bg-surface-elevated font-bold transition-all"
                      >
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                          {link.label === "Lịch sử" ? (
                            <Clock size={18} />
                          ) : link.label === "Theo dõi" ? (
                            <Library size={18} />
                          ) : (
                            <Search size={18} />
                          )}
                        </div>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Account Section */}
                <div className="space-y-3 pt-4 border-t border-border-brand/50">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500 px-1">
                    Cá nhân
                  </span>
                  {loggedIn ? (
                    <div className="space-y-1">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-text-secondary hover:text-emerald-500 transition-all font-medium"
                        >
                          <span className="p-2 rounded-lg bg-surface-elevated">
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold mt-2"
                      >
                        <span className="p-2 rounded-lg bg-rose-500/10">
                          <LogOut size={18} />
                        </span>
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 px-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center p-4 rounded-2xl bg-surface-elevated border border-border-brand font-bold text-text-primary hover:border-emerald-500/50 transition-all"
                      >
                        Đăng nhập ngay
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center p-4 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        Tạo tài khoản mới
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
