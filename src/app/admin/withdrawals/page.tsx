"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Withdrawal {
  id: string;
  amount: number;
  description: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  wallet: {
    user: {
      id: string;
      displayName: string;
      email: string;
      username: string;
    };
  };
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Withdrawal[]>("/admin/withdrawals");
      setWithdrawals(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Lỗi khi tải danh sách rút tiền");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Xác nhận bạn ĐÃ CHUYỂN KHOẢN cho tác giả này?")) return;
    try {
      setProcessingId(id);
      await apiFetch(`/admin/withdrawals/${id}/approve`, { method: "PUT" });
      alert("Đã duyệt thành công!");
      fetchWithdrawals();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Lỗi khi duyệt");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt(
      "Lý do từ chối (Tiền sẽ được hoàn lại vào ví tác giả):",
    );
    if (reason === null) return; // User cancelled
    try {
      setProcessingId(id);
      await apiFetch(`/admin/withdrawals/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
      alert("Đã từ chối và hoàn tiền thành công!");
      fetchWithdrawals();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Lỗi khi từ chối");
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>
        Quản lý Rút tiền
      </h1>

      {withdrawals.length === 0 ? (
        <p className="text-muted">Không có yêu cầu rút tiền nào.</p>
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
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <th style={{ padding: "1rem" }}>Tác giả</th>
                <th style={{ padding: "1rem" }}>Chi tiết rút tiền</th>
                <th style={{ padding: "1rem" }}>Số xu</th>
                <th style={{ padding: "1rem" }}>Trạng thái</th>
                <th style={{ padding: "1rem" }}>Thời gian</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr
                  key={w.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600 }}>
                      {w.wallet.user.displayName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {w.wallet.user.email}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", maxWidth: "300px" }}>
                    {w.description}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--destructive)",
                      fontWeight: 600,
                    }}
                  >
                    {w.amount}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "1rem",
                        fontSize: "0.875rem",
                        backgroundColor:
                          w.status === "PENDING"
                            ? "rgba(234, 179, 8, 0.1)" // Yellow
                            : w.status === "COMPLETED"
                              ? "rgba(34, 197, 94, 0.1)" // Green
                              : "rgba(239, 68, 68, 0.1)", // Red
                        color:
                          w.status === "PENDING"
                            ? "rgb(234, 179, 8)"
                            : w.status === "COMPLETED"
                              ? "rgb(34, 197, 94)"
                              : "rgb(239, 68, 68)",
                      }}
                    >
                      {w.status === "PENDING" && "Đang chờ"}
                      {w.status === "COMPLETED" && "Hoàn thành"}
                      {w.status === "FAILED" && "Từ chối"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--muted-foreground)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {new Date(w.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {w.status === "PENDING" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-primary"
                          onClick={() => handleApprove(w.id)}
                          disabled={processingId === w.id}
                        >
                          Duyệt
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ color: "var(--destructive)" }}
                          onClick={() => handleReject(w.id)}
                          disabled={processingId === w.id}
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
