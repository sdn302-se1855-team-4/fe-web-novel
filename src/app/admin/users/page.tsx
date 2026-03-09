"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { UserCircle, Shield, Pen } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminUser[]>("/admin/users")
      .then((res) => setUsers(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <Shield size={12} /> QUẢN TRỊ VIÊN
          </span>
        );
      case "WRITER":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: "rgba(245, 158, 11, 0.1)",
              color: "#f59e0b",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <Pen size={12} /> TÁC GIẢ
          </span>
        );
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: "rgba(var(--color-primary-rgb), 0.1)",
              color: "var(--color-primary)",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <UserCircle size={12} /> ĐỘC GIẢ
          </span>
        );
    }
  };

  return (
    <div>
      <h1 className="section-title">Quản lý Người dùng</h1>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: "300px" }} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "1rem" }}>Người dùng</th>
                  <th style={{ padding: "1rem" }}>Email</th>
                  <th style={{ padding: "1rem" }}>Vai trò</th>
                  <th style={{ padding: "1rem" }}>Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "var(--color-surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          <UserCircle size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {user.displayName || user.username}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>{user.email}</td>
                    <td style={{ padding: "1rem" }}>
                      {getRoleBadge(user.role)}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--color-text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {new Date(user.createdAt).toLocaleDateString("vi")}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "gray",
                      }}
                    >
                      Không có người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
