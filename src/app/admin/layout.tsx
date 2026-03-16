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
  ArrowLeft,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navSections = [
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Admin Panel</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Web Novel Platform</p>
            </div>
            <button
              className="ml-auto lg:hidden p-1 rounded-md hover:bg-slate-800 text-slate-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
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
                            ? "bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <item.icon
                          size={18}
                          className={isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}
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
          <div className="border-t border-slate-800 p-3">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft size={18} />
              Về trang chủ
            </Link>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 mr-3 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-semibold text-slate-300">
              {navSections
                .flatMap((s) => s.items)
                .find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))
                ?.label || "Admin"}
            </h2>
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
