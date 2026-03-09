"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { Users, BookOpen, Layers, Edit3, Settings } from "lucide-react";

interface AdminStats {
  users: number;
  stories: number;
  chapters: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    stories: 0,
    chapters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminStats>("/admin/stats")
      .then((res) => setStats(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="section-title">Tổng quan hệ thống</h1>

      {loading ? (
        <div className="skeleton" style={{ height: "150px" }} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                background: "rgba(var(--color-primary-rgb), 0.1)",
                borderRadius: "50%",
                color: "var(--color-primary)",
              }}
            >
              <Users size={32} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.7 }}>
                Tổng người dùng
              </p>
              <h2 style={{ margin: 0, fontSize: "2rem" }}>{stats.users}</h2>
            </div>
          </div>

          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "50%",
                color: "#10b981",
              }}
            >
              <BookOpen size={32} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.7 }}>
                Tổng truyện
              </p>
              <h2 style={{ margin: 0, fontSize: "2rem" }}>{stats.stories}</h2>
            </div>
          </div>

          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                background: "rgba(245, 158, 11, 0.1)",
                borderRadius: "50%",
                color: "#f59e0b",
              }}
            >
              <Layers size={32} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.7 }}>
                Tổng chương
              </p>
              <h2 style={{ margin: 0, fontSize: "2rem" }}>{stats.chapters}</h2>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2
        className="section-title"
        style={{ marginTop: "2rem", fontSize: "1.25rem" }}
      >
        Truy cập nhanh
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        <Link
          href="/admin/stories"
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1.5rem",
            textDecoration: "none",
            color: "inherit",
            transition: "transform 0.2s",
          }}
        >
          <div
            style={{
              padding: "1rem",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "var(--radius-lg)",
              color: "#10b981",
            }}
          >
            <Edit3 size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
              Quản lý Truyện
            </h3>
            <p
              style={{ margin: "4px 0 0", fontSize: "0.875rem", opacity: 0.7 }}
            >
              Duyệt nội dung, gỡ xuất bản
            </p>
          </div>
        </Link>
        <Link
          href="/admin/users"
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1.5rem",
            textDecoration: "none",
            color: "inherit",
            transition: "transform 0.2s",
          }}
        >
          <div
            style={{
              padding: "1rem",
              background: "rgba(245, 158, 11, 0.1)",
              borderRadius: "var(--radius-lg)",
              color: "#f59e0b",
            }}
          >
            <Settings size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
              Quản lý Người dùng
            </h3>
            <p
              style={{ margin: "4px 0 0", fontSize: "0.875rem", opacity: 0.7 }}
            >
              Phân quyền hệ thống
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
