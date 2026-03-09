"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, UserPlus, BookOpen, PenTool } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import styles from "../login/auth.module.css";

interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("READER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: name,
          email,
          password,
          confirmPassword,
          role,
        }),
      });
      setTokens(data.accessToken, data.refreshToken, data.user?.role);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Đăng ký</h1>
          <p className={styles.subtitle}>Tạo tài khoản BestNovelVN mới</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className="form-group">
            <label htmlFor="name" className="label">
              Tên hiển thị
            </label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="name"
                type="text"
                className={`input ${styles.inputWithIcon}`}
                placeholder="Tên của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="label">
              Email
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className={`input ${styles.inputWithIcon}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              Mật khẩu
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className={`input ${styles.inputWithIcon}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">
              Xác nhận mật khẩu
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="confirmPassword"
                type="password"
                className={`input ${styles.inputWithIcon}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Bạn là ai?</label>
            <div className={styles.roleSelector}>
              <div
                className={`${styles.roleOption} ${role === "READER" ? styles.roleOptionActive : ""}`}
                onClick={() => setRole("READER")}
              >
                <input
                  type="radio"
                  name="role"
                  value="READER"
                  className={styles.radioHidden}
                  checked={role === "READER"}
                  readOnly
                />
                <BookOpen size={24} className={styles.roleIcon} />
                <span className={styles.roleLabel}>Độc giả</span>
                <span className={styles.roleDesc}>Thỏa sức đọc truyện</span>
              </div>
              <div
                className={`${styles.roleOption} ${role === "WRITER" ? styles.roleOptionActive : ""}`}
                onClick={() => setRole("WRITER")}
              >
                <input
                  type="radio"
                  name="role"
                  value="WRITER"
                  className={styles.radioHidden}
                  checked={role === "WRITER"}
                  readOnly
                />
                <PenTool size={24} className={styles.roleIcon} />
                <span className={styles.roleLabel}>Tác giả</span>
                <span className={styles.roleDesc}>Sáng tác truyện mới</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <UserPlus size={18} />
                Đăng ký
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Đã có tài khoản?{" "}
          <Link href="/login" className={styles.link}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
