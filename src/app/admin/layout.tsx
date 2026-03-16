"use client";

import RoleGuard from "@/components/RoleGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  Tag,
  Layers,
  Shield,
  Menu,
  X,
  User,
  LogOut,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { removeTokens } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "QUẢN LÝ",
    items: [
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/stories", label: "Nội dung", icon: BookOpen },
      { href: "/admin/withdrawals", label: "Rút tiền", icon: Wallet },
    ],
  },
  {
    label: "DANH MỤC",
    items: [
      { href: "/admin/genres", label: "Thể loại", icon: Layers },
      { href: "/admin/tags", label: "Tags", icon: Tag },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Hydration guard using useSyncExternalStore for cleaner state sync
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );



  const handleLogout = () => {
    removeTokens();
    router.push("/login");
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex h-screen bg-bg-brand text-text-primary overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-brand border-r border-border-brand flex flex-col transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-border-brand">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary leading-none">Admin Panel</h1>
              <p className="text-[11px] text-text-muted mt-0.5">Web Novel Platform</p>
            </div>
            <button
              className="ml-auto lg:hidden p-1 rounded-md hover:bg-surface-elevated text-text-muted"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/5"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                        }`}
                      >
                        <item.icon
                          size={18}
                          className={isActive ? "text-emerald-500" : "text-text-muted group-hover:text-text-secondary"}
                        />
                        {item.label}
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border-brand p-3 space-y-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors duration-200 cursor-pointer"
            >
              <User size={18} className="text-text-muted" />
              Hồ sơ
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-200 cursor-pointer"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 flex items-center px-6 border-b border-border-brand bg-surface-brand/50 backdrop-blur-sm shrink-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-surface-elevated text-text-muted mr-3 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-semibold text-text-primary">
              {navSections
                .flatMap((s) => s.items)
                .find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))
                ?.label || "Admin"}
            </h2>
            <div className="flex items-center gap-3 ml-auto">
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-surface-elevated hover:bg-border-brand text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-border-brand"
                  title={theme === "light" ? "Giao diện tối" : "Giao diện sáng"}
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
