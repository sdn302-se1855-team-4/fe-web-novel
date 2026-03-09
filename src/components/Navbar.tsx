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
import styles from "./Navbar.module.css";

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
    <header className={styles.header}>
      <nav className={styles.nav}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <BookOpen size={28} />
          <span className={styles.logoText}>BestNovelVN</span>
        </Link>

        {/* Genre Dropdown */}
        <div className={styles.genreDropdownWrap} ref={genreRef}>
          <button
            className={styles.genreToggle}
            onClick={() => setGenreOpen((p) => !p)}
          >
            Thể loại{" "}
            <ChevronDown
              size={14}
              className={genreOpen ? styles.chevronUp : ""}
            />
          </button>
          {genreOpen && (
            <div className={styles.genreDropdown}>
              <Link
                href="/stories"
                className={styles.genreItem}
                onClick={() => setGenreOpen(false)}
              >
                Tất cả
              </Link>
              {genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/stories?genre=${g.id}`}
                  className={styles.genreItem}
                  onClick={() => setGenreOpen(false)}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm truyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Desktop Nav — only Trang chủ */}
        <ul className={styles.links}>
          <li>
            <Link
              href="/"
              className={`${styles.link} ${pathname === "/" ? styles.active : ""}`}
            >
              Trang chủ
            </Link>
          </li>
        </ul>

        {/* Right side actions */}
        <div className={styles.actions}>
          {/* Notification Bell */}
          {loggedIn && (
            <div className={styles.notifWrap} ref={notifRef}>
              <button
                className={`btn-icon ${styles.bellBtn}`}
                onClick={() => setNotifOpen((p) => !p)}
                aria-label="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span className={styles.notifTitle}>Thông báo</span>
                    {unreadCount > 0 && (
                      <button
                        className={styles.notifMarkAll}
                        onClick={markAllRead}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ""}`}
                        >
                          <p className={styles.notifMsg}>{n.message}</p>
                          <span className={styles.notifTime}>
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className={styles.notifEmpty}>Không có thông báo</p>
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    className={styles.notifViewAll}
                    onClick={() => setNotifOpen(false)}
                  >
                    Xem tất cả →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? "Chuyển sang chế độ tối"
                : "Chuyển sang chế độ sáng"
            }
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* User Avatar Dropdown */}
          {loggedIn ? (
            <div className={styles.userMenuWrap} ref={userMenuRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => setUserMenuOpen((p) => !p)}
                aria-label="Menu người dùng"
              >
                <User size={20} />
                <ChevronDown
                  size={12}
                  className={userMenuOpen ? styles.chevronUp : ""}
                />
              </button>
              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={styles.userMenuItem}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                  <div className={styles.userMenuDivider} />
                  <button
                    className={styles.userMenuItem}
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
              className={`btn btn-primary ${styles.loginBtn}`}
            >
              Đăng nhập
            </Link>
          )}

          <button
            className={`btn-icon ${styles.mobileToggle}`}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm truyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile Genre List */}
          <div className={styles.mobileGenreSection}>
            <span className={styles.mobileGenreLabel}>Thể loại</span>
            <div className={styles.mobileGenreList}>
              {genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/stories?genre=${g.id}`}
                  className={styles.mobileGenreChip}
                  onClick={() => setMobileOpen(false)}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className={styles.mobileLink}
            onClick={() => setMobileOpen(false)}
          >
            Trang chủ
          </Link>
          {loggedIn && (
            <>
              {userMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.mobileLink}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <Link
                href="/notifications"
                className={styles.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                <Bell size={16} />
                Thông báo {unreadCount > 0 && `(${unreadCount})`}
              </Link>
              <button className={styles.mobileLink} onClick={handleLogout}>
                <LogOut size={18} />
                Đăng xuất
              </button>
            </>
          )}
          {!loggedIn && (
            <Link
              href="/login"
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
