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
  ArrowUpRight,
  ArrowRight,
  Eye,
  CheckCircle,
  AlertCircle,
  DollarSign,
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

interface AdminExtendedStats {
  summary: {
    userGrowth: number;
    storyGrowth: number;
    chapterGrowth: number;
    revenueGrowth?: number;
  };
  monthlyData: { name: string; users: number; stories: number; revenue?: number }[];
}


interface RoleDistribution {
  name: string;
  value: number;
  color?: string;
}

interface ContentTypeStat {
  name: string;
  count: number;
}

// Colors for pie chart
const PIE_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({ users: 0, stories: 0, chapters: 0 });
  const [pendingStories, setPendingStories] = useState<PendingStory[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real API states
  const [summary, setSummary] = useState<Partial<AdminExtendedStats["summary"]>>({});
  const [monthlyData, setMonthlyData] = useState<AdminExtendedStats["monthlyData"]>([]);
  const [roleData, setRoleData] = useState<RoleDistribution[]>([]);
  const [contentData, setContentData] = useState<ContentTypeStat[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>("/admin/stats").catch(() => ({ users: 0, stories: 0, chapters: 0 })),
      apiFetch<PendingStory[]>("/admin/stories").catch(() => []),
      apiFetch<PendingWithdrawal[]>("/admin/withdrawals").catch(() => []),
      apiFetch<AdminExtendedStats>("/admin/stats/extended").catch(() => ({ summary: { userGrowth: 0, storyGrowth: 0, chapterGrowth: 0 }, monthlyData: [] })),
      apiFetch<RoleDistribution[]>("/admin/stats/role-distribution").catch(() => []),
      apiFetch<ContentTypeStat[]>("/admin/stats/content-types").catch(() => [])
    ]).then(([s, storiesRes, withdrawalsRes, ext, roles, contents]) => {
      setStats(s);
      
      const stories = Array.isArray(storiesRes) ? storiesRes : (storiesRes as { data?: PendingStory[] }).data || [];
      const withdrawals = Array.isArray(withdrawalsRes) ? withdrawalsRes : (withdrawalsRes as { data?: PendingWithdrawal[] }).data || [];

      setPendingStories(stories.filter((st: PendingStory) => !st.isPublished).slice(0, 5));
      setPendingWithdrawals(withdrawals.filter((w: PendingWithdrawal) => w.status === "PENDING").slice(0, 5));
      
      if (ext?.summary) setSummary(ext.summary);
      if (ext?.monthlyData) setMonthlyData(ext.monthlyData);
      
      if (roles && Array.isArray(roles)) {
        setRoleData(roles.map((r, i) => ({ ...r, color: PIE_COLORS[i % PIE_COLORS.length] })));
      }
      if (contents && Array.isArray(contents)) {
        setContentData(contents);
      }
      
      setLoading(false);
    });
  }, []);

  const totalRevenue = monthlyData.reduce((sum, m) => sum + (m.revenue || 0), 0);

  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats.users,
      icon: Users,
      trend: `${(summary.userGrowth || 0) > 0 ? "+" : ""}${summary.userGrowth || 0}%`,
      trendUp: (summary.userGrowth || 0) >= 0,
      gradient: "from-indigo-500 to-indigo-600",
      shadow: "shadow-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
    },
    {
      label: "Tổng truyện",
      value: stats.stories,
      icon: BookOpen,
      trend: `${(summary.storyGrowth || 0) > 0 ? "+" : ""}${summary.storyGrowth || 0}%`,
      trendUp: (summary.storyGrowth || 0) >= 0,
      gradient: "from-emerald-500 to-emerald-600",
      shadow: "shadow-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      label: "Tổng chương",
      value: stats.chapters,
      icon: Layers,
      trend: `${(summary.chapterGrowth || 0) > 0 ? "+" : ""}${summary.chapterGrowth || 0}%`,
      trendUp: (summary.chapterGrowth || 0) >= 0,
      gradient: "from-amber-500 to-amber-600",
      shadow: "shadow-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      label: "Tổng doanh thu",
      value: totalRevenue,
      icon: DollarSign,
      trend: `${(summary.revenueGrowth || 0) > 0 ? "+" : ""}${summary.revenueGrowth || 0}%`,
      trendUp: (summary.revenueGrowth || 0) >= 0,
      gradient: "from-violet-500 to-violet-600",
      shadow: "shadow-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      suffix: " xu",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-brand border border-border-brand animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-surface-brand border border-border-brand animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp size={24} className="text-emerald-400" />
            Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-1">Tổng quan hệ thống Web Novel Platform</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl bg-surface-brand border border-border-brand p-5 hover:border-emerald-500/30 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-extrabold text-text-primary mt-2">
                  {card.value.toLocaleString("vi")}{(card as { suffix?: string }).suffix || ""}
                </p>
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
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-linear-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart - Growth */}
        <div className="lg:col-span-2 rounded-xl bg-surface-brand border border-border-brand p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Tăng trưởng nền tảng</h3>
              <p className="text-xs text-text-muted mt-0.5">Người dùng & truyện theo tháng</p>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
              6 tháng gần nhất
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border-brand" />
              <XAxis dataKey="name" stroke="currentColor" className="text-text-muted" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="currentColor" className="text-text-muted" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  borderColor: "var(--color-border-brand)",
                  borderRadius: "0.75rem",
                  color: "var(--color-text-primary)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              />
              <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Người dùng" />
              <Area type="monotone" dataKey="stories" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStories)" name="Truyện" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart - Revenue */}
        <div className="rounded-xl bg-surface-brand border border-border-brand p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Doanh thu</h3>
              <p className="text-xs text-text-muted mt-0.5">Xu thu được theo tháng</p>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500">
              6 tháng gần nhất
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border-brand" />
              <XAxis dataKey="name" stroke="currentColor" className="text-text-muted" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-text-muted" fontSize={12} tickLine={false} axisLine={false} width={40} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  borderColor: "var(--color-border-brand)",
                  borderRadius: "0.75rem",
                  color: "var(--color-text-primary)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Doanh thu (xu)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Content Types */}
        <div className="lg:col-span-2 rounded-xl bg-surface-brand border border-border-brand p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary mb-5">Phân bố thể loại (Top 5)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={contentData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border-brand" horizontal={false} />
              <XAxis type="number" stroke="currentColor" className="text-text-muted" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="currentColor" className="text-text-muted" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-surface-elevated)" }}
                contentStyle={{
                  backgroundColor: "var(--color-surface-brand)",
                  border: "1px solid var(--color-border-brand)",
                  borderRadius: "0.75rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-primary)"
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Số truyện" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Roles */}
        <div className="rounded-xl bg-surface-brand border border-border-brand p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-text-primary mb-2">Cơ cấu người dùng</h3>
          <ResponsiveContainer width="100%" className="flex-1 min-h-[200px]">
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-brand)",
                  borderRadius: "0.75rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-primary)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center flex-wrap gap-4 mt-2">
            {roleData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Stories */}
        <div className="rounded-xl bg-surface-brand border border-border-brand overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-brand">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Truyện chờ duyệt
            </h3>
            <Link href="/admin/stories" className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          {pendingStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <CheckCircle size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Không có truyện nào chờ duyệt</p>
            </div>
          ) : (
            <div className="divide-y divide-border-brand">
              {pendingStories.map((story) => (
                <div key={story.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-elevated transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{story.title}</p>
                    <p className="text-xs text-text-muted">{story.author?.displayName || story.author?.username}</p>
                  </div>
                  <Link href={`/stories/${story.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all cursor-pointer shrink-0">
                    <Eye size={13} /> Xem
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="rounded-xl bg-surface-brand border border-border-brand overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-brand">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Wallet size={16} className="text-indigo-500" />
              Rút tiền chờ duyệt
            </h3>
            <Link href="/admin/withdrawals" className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          {pendingWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <CheckCircle size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Không có yêu cầu rút tiền nào</p>
            </div>
          ) : (
            <div className="divide-y divide-border-brand">
              {pendingWithdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-elevated transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{w.wallet.user.displayName}</p>
                    <p className="text-xs text-text-muted">{w.wallet.user.email}</p>
                  </div>
                  <span className="text-sm font-bold text-rose-500 shrink-0">
                    {Math.abs(w.amount).toLocaleString("vi")} xu
                  </span>
                  <Link href={`/admin/withdrawals`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all cursor-pointer shrink-0 ml-3">
                    <Eye size={13} /> Xem
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
