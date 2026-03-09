import RoleGuard from "@/components/RoleGuard";
import Link from "next/link";
import { Users, BookOpen, BarChart3 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="page-wrapper">
        <div
          className="container"
          style={{ display: "flex", gap: "2rem", maxWidth: "1440px" }}
        >
          <aside style={{ width: "250px", flexShrink: 0 }}>
            <div className="card" style={{ padding: "1rem" }}>
              <h2 className="section-title">Admin Panel</h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <li>
                  <Link
                    href="/admin"
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <BarChart3 size={18} /> Tổng quan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/users"
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <Users size={18} /> Quản lý người dùng
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/stories"
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <BookOpen size={18} /> Quản lý nội dung
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/withdrawals"
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <BarChart3 size={18} /> Quản lý rút tiền
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
          <main style={{ flex: 1 }}>{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
