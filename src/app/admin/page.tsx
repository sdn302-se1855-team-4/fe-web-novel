"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Layers,
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AdminStats {
  users: number;
  stories: number;
  chapters: number;
}

interface PendingStory {
  id: string;
  title: string;
  isPublished?: boolean;
  author: { displayName: string; username: string };
  createdAt: string;
}

interface PendingWithdrawal {
  id: string;
  amount: number;
  status?: string;
  wallet: { user: { displayName: string; email: string } };
  createdAt: string;
}

// Mock data for charts (will be replaced when backend provides real data)
const mockMonthlyData = [
  { name: "T1", users: 45, stories: 12, revenue: 320 },
  { name: "T2", users: 62, stories: 18, revenue: 480 },
  { name: "T3", users: 78, stories: 24, revenue: 620 },
  { name: "T4", users: 95, stories: 31, revenue: 750 },
  { name: "T5", users: 121, stories: 38, revenue: 890 },
  { name: "T6", users: 148, stories: 45, revenue: 1050 },
];

const roleDistribution = [
  { name: "Độc giả", value: 70, color: "#6366f1" },
  { name: "Tác giả", value: 25, color: "#f59e0b" },
  { name: "Admin", value: 5, color: "#ef4444" },
];

const contentTypeData = [
  { name: "Novel", count: 45 },
  { name: "Manga", count: 28 },
  { name: "LightNovel", count: 18 },
  { name: "Comic", count: 9 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({ users: 0, stories: 0, chapters: 0 });
  const [pendingStories, setPendingStories] = useState<PendingStory[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>("/admin/stats").catch(() => ({ users: 0, stories: 0, chapters: 0 })),
      apiFetch<PendingStory[]>("/admin/stories").catch(() => []),
      apiFetch<PendingWithdrawal[]>("/admin/withdrawals").catch(() => []),
    ]).then(([s, stories, withdrawals]) => {
      setStats(s);
      setPendingStories(stories.filter((st) => !st.isPublished).slice(0, 5));
      setPendingWithdrawals(withdrawals.filter((w) => w.status === "PENDING").slice(0, 5));
      setLoading(false);
    });
  }, []);

  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats.users,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      gradient: "from-indigo-500 to-indigo-600",
      shadow: "shadow-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
    },
    {
      label: "Tổng truyện",
      value: stats.stories,
      icon: BookOpen,
      trend: "+8%",
      trendUp: true,
      gradient: "from-emerald-500 to-emerald-600",
      shadow: "shadow-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      label: "Tổng chương",
      value: stats.chapters,
      icon: Layers,
      trend: "+24%",
      trendUp: true,
      gradient: "from-amber-500 to-amber-600",
      shadow: "shadow-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      label: "Chờ xử lý",
      value: pendingStories.length + pendingWithdrawals.length,
      icon: Clock,
      trend: "Cần duyệt",
      trendUp: false,
      gradient: "from-rose-500 to-rose-600",
      shadow: "shadow-rose-500/20",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-slate-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={24} className="text-emerald-400" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Tổng quan hệ thống Web Novel Platform</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-extrabold text-white mt-2">{card.value.toLocaleString("vi")}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${card.trendUp ? "text-emerald-400" : "text-amber-400"}`}>
                  {card.trendUp && <ArrowUpRight size={14} />}
                  {card.trend}
                </div>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
            </div>
            {/* Decorative gradient */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart - Growth */}
        <div className="lg:col-span-2 rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Tăng trưởng nền tảng</h3>
              <p className="text-xs text-slate-500 mt-0.5">Người dùng & truyện theo tháng</p>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
              6 tháng gần nhất
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockMonthlyData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorStories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  fontSize: "0.8125rem",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Người dùng" />
              <Area type="monotone" dataKey="stories" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStories)" name="Truyện" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Roles */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-white mb-1">Phân bổ vai trò</h3>
          <p className="text-xs text-slate-500 mb-4">Tỷ lệ người dùng theo vai trò</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  fontSize: "0.8125rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {roleDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart - Content Types */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">Phân bổ nội dung</h3>
            <p className="text-xs text-slate-500 mt-0.5">Số lượng truyện theo loại</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={contentTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#475569" fontSize={12} />
            <YAxis stroke="#475569" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
              }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Số truyện" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Stories */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              Truyện chờ duyệt
            </h3>
            <Link href="/admin/stories" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          {pendingStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <CheckCircle size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Không có truyện nào chờ duyệt</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {pendingStories.map((story) => (
                <div key={story.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{story.title}</p>
                    <p className="text-xs text-slate-500">{story.author?.displayName || story.author?.username}</p>
                  </div>
                  <Link href={`/stories/${story.id}`} className="p-2 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0">
                    <Eye size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet size={16} className="text-indigo-400" />
              Rút tiền chờ duyệt
            </h3>
            <Link href="/admin/withdrawals" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          {pendingWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <CheckCircle size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Không có yêu cầu rút tiền nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {pendingWithdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{w.wallet.user.displayName}</p>
                    <p className="text-xs text-slate-500">{w.wallet.user.email}</p>
                  </div>
                  <span className="text-sm font-bold text-rose-400 flex-shrink-0">
                    {Math.abs(w.amount).toLocaleString("vi")} xu
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
