"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BarChart3, TrendingUp, Users, BookOpen, Coins, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AnalyticsData {
  totalViews: number;
  totalFollowers: number;
  totalStories: number;
  totalEarnings: number;
  stories: AnalyticsStory[];
}

interface AnalyticsStory {
  id: string;
  title: string;
  viewCount: number;
  totalEarnings?: number;
  _count?: {
    chapters: number;
  };
}

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    // In a real app we'd have a specific /studio/analytics endpoint.
    // Here we aggregate from my stories and wallet if necessary, or just mock some fields if missing,
    // assuming we fetch my stories to sum the views.
    Promise.all([
      apiFetch<AnalyticsStory[] | { data: AnalyticsStory[] }>("/stories/my").catch(() => []),
      apiFetch<{ totalEarned: number }>("/wallet").catch(() => null)
    ])
      .then(([storiesRes, walletRes]) => {
        const storiesList = Array.isArray(storiesRes)
          ? storiesRes
          : (storiesRes as { data: AnalyticsStory[] }).data || [];
          
        const totalViews = storiesList.reduce(
          (acc, s) => acc + (s.viewCount || 0),
          0,
        );
        
        // Use real wallet earnings, default to 0
        const actualEarnings = walletRes ? walletRes.totalEarned : 0;
        
        // Still mock followers for now since we don't have a simple /me endpoint with followers count
        const mockFollowers = Math.floor(totalViews * 0.15);

        setData({
          totalViews,
          totalFollowers: mockFollowers,
          totalStories: storiesList.length,
          totalEarnings: actualEarnings,
          stories: storiesList.sort(
            (a, b) => (b.viewCount || 0) - (a.viewCount || 0),
          ),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="page-wrapper container">
        <h1 className="section-title">Thống kê & Doanh thu</h1>
        <div
          className="skeleton"
          style={{ height: "200px", marginBottom: "2rem" }}
        />
      </div>
    );
  }

  if (!data) return null;

  const maxViews = Math.max(...data.stories.map((s) => s.viewCount || 0), 10); // Minimum 10 to avoid div by zero

  return (
    <div className="pb-12">
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
        >
          <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-emerald-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Quay lại
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 className="section-title" style={{ margin: 0 }}>
          <BarChart3 size={28} style={{ marginRight: "0.5rem" }} /> Thống kê Tác
          giả
        </h1>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          className="card"
          style={{
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              background: "rgba(37, 99, 235, 0.1)",
              color: "#2563eb",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <TrendingUp size={28} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              Tổng lượt đọc
            </p>
            <h2 style={{ margin: 0, fontSize: "1.75rem" }}>
              {data.totalViews.toLocaleString()}
            </h2>
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Users size={28} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              Người theo dõi (Ước tính)
            </p>
            <h2 style={{ margin: 0, fontSize: "1.75rem" }}>
              {data.totalFollowers.toLocaleString()}
            </h2>
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              background: "rgba(245, 158, 11, 0.1)",
              color: "#f59e0b",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Coins size={28} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}
            >
              Doanh thu dự kiến
            </p>
            <h2 style={{ margin: 0, fontSize: "1.75rem" }}>
              {data.totalEarnings.toLocaleString()} Xu
            </h2>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <h2 className="section-title" style={{ fontSize: "1.5rem" }}>
        Hiệu suất truyện
      </h2>
      <div className="card" style={{ padding: "2rem" }}>
        {data.stories.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            Bạn chưa có truyện nào để thống kê.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {data.stories.slice(0, 5).map((story) => {
              const percentage = ((story.viewCount || 0) / maxViews) * 100;
              return (
                <div key={story.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <BookOpen size={16} /> {story.title}
                    </strong>
                    <span style={{ fontWeight: 600, display: "flex", gap: "1rem" }}>
                      <span>{(story.viewCount || 0).toLocaleString()} lượt đọc</span>
                      <span style={{ color: "var(--color-primary)" }}>
                        {(story.totalEarnings || 0).toLocaleString()} xu
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "12px",
                      background: "var(--color-surface)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percentage}%`,
                        background: "var(--color-primary)",
                        borderRadius: "99px",
                        transition: "width 1s ease-out",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
