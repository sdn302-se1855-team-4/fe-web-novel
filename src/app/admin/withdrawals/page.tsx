"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ConfirmModal, { InputModal } from "@/components/ConfirmModal";

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

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });

  const { showToast } = useToast();

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
    try {
      setProcessingId(id);
      setConfirmModal({ open: false, id: "", name: "" });
      await apiFetch(`/admin/withdrawals/${id}/approve`, { method: "PUT" });
      showToast(
        "Đã duyệt yêu cầu rút tiền và gửi thông báo cho tác giả!",
        "success",
      );
      fetchWithdrawals();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Lỗi khi duyệt", "error");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      setProcessingId(id);
      setRejectModal({ open: false, id: "", name: "" });
      await apiFetch(`/admin/withdrawals/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
      showToast("Đã từ chối và hoàn tiền xu cho tác giả!", "warning");
      fetchWithdrawals();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Lỗi khi từ chối", "error");
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div style={{ color: "var(--destructive)" }}>{error}</div>;

  return (
    <>
      <div className="card" style={{ padding: "1.5rem" }}>
        <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>
          Quản lý Rút tiền
        </h1>

        {withdrawals.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            Không có yêu cầu rút tiền nào.
          </p>
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
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
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
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>
                        {w.wallet.user.displayName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-text-muted)",
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
                        color: "#ef4444",
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
                              ? "rgba(234, 179, 8, 0.1)"
                              : w.status === "COMPLETED"
                                ? "rgba(34, 197, 94, 0.1)"
                                : "rgba(239, 68, 68, 0.1)",
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
                        color: "var(--color-text-muted)",
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
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                id: w.id,
                                name: w.wallet.user.displayName,
                              })
                            }
                            disabled={processingId === w.id}
                          >
                            Duyệt
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ color: "#ef4444" }}
                            onClick={() =>
                              setRejectModal({
                                open: true,
                                id: w.id,
                                name: w.wallet.user.displayName,
                              })
                            }
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

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Xác nhận duyệt rút tiền"
        message={`Bạn xác nhận đã CHUYỂN KHOẢN thành công cho tác giả "${confirmModal.name}"? Tác giả sẽ nhận được thông báo từ hệ thống.`}
        confirmText="Đã chuyển khoản"
        cancelText="Hủy"
        variant="primary"
        onConfirm={() => handleApprove(confirmModal.id)}
        onCancel={() => setConfirmModal({ open: false, id: "", name: "" })}
      />

      {/* Reject Input Modal */}
      <InputModal
        isOpen={rejectModal.open}
        title="Từ chối yêu cầu rút tiền"
        message={`Nhập lý do từ chối cho tác giả "${rejectModal.name}". Xu sẽ được hoàn lại vào ví của tác giả.`}
        placeholder="Lý do từ chối..."
        confirmText="Xác nhận từ chối"
        cancelText="Hủy"
        onConfirm={(reason) => handleReject(rejectModal.id, reason)}
        onCancel={() => setRejectModal({ open: false, id: "", name: "" })}
      />
    </>
  );
}
