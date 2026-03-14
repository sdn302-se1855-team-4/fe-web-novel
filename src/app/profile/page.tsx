"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Lock,
  Camera,
  Info,
  ShieldCheck,
  Mail,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import styles from "./profile-settings.module.css";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  role: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    bio: "",
    gender: "OTHER",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    apiFetch<UserProfile>("/auth/profile")
      .then((res) => {
        setUser(res);
        setFormData({
          displayName: res.displayName || res.username,
          firstName: res.firstName || "",
          lastName: res.lastName || "",
          bio: res.bio || "",
          gender: res.gender || "OTHER",
        });
      })
      .catch(() => {
        showToast("Không thể tải thông tin cá nhân", "error");
      })
      .finally(() => setLoading(false));
  }, [router, showToast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await apiFetch<UserProfile>("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName || undefined,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          bio: formData.bio || undefined,
          gender: formData.gender,
          ...(previewImage ? { avatar: previewImage } : {}),
        }),
      });

      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
      showToast("Cập nhật thông tin thành công", "success");

      window.dispatchEvent(
        new CustomEvent("user-profile-updated", {
          detail: {
            avatar: previewImage || user?.avatar,
            displayName: formData.displayName,
          },
        })
      );
    } catch {
      showToast("Cập nhật thất bại, vui lòng thử lại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Kích thước ảnh không được vượt quá 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        showToast("Đã chọn ảnh mới. Nhấn Lưu để cập nhật.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });
      showToast("Đổi mật khẩu thành công", "success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordDialog(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Đổi mật khẩu thất bại, thử lại";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-wrapper min-h-screen overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`container ${styles.page} ${styles.container}`}
      >
        <main className={styles.mainContent}>
          {/* Avatar section */}
          <section className={styles.avatarSection}>
            <div className={styles.avatarWrap}>
              <img
                src={
                  previewImage ||
                  user.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username
                }
                alt={user.username}
                className={styles.avatar}
              />
              <div
                className={styles.avatarOverlay}
                title="Đổi ảnh đại diện"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={32} />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className={styles.avatarButtonGroup}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-8 rounded flex items-center gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-wider"
              >
                <Upload size={18} /> Chọn hình
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
                className="border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500 font-bold h-10 px-8 rounded flex items-center gap-2 uppercase tracking-wider"
              >
                <Lock size={18} /> Đổi mật khẩu
              </Button>
            </div>
            <p className={styles.avatarWarning}>
              Lưu ý: Hình ảnh đại diện phải phù hợp thuần phong mỹ tục.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-12">
            {/* Account Info (read-only) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.formSection}
            >
              <h2 className={styles.sectionHeading}>
                <ShieldCheck className="text-emerald-500" /> Thông tin tài khoản
              </h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tên đăng nhập</label>
                  <div className="relative">
                    <Input
                      value={user.username}
                      readOnly
                      className="bg-emerald-500/5 border-emerald-500/20 pl-12 h-10 rounded font-bold text-text-muted cursor-default"
                    />
                    <UserIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                      size={18}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Địa chỉ Email</label>
                  <div className="relative">
                    <Input
                      value={user.email}
                      readOnly
                      className="bg-emerald-500/5 border-emerald-500/20 pl-12 h-10 rounded font-bold text-text-muted cursor-default"
                    />
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                      size={18}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Personal Info form */}
            <motion.form
              onSubmit={handleUpdateProfile}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={styles.formSection}
            >
              <h2 className={styles.sectionHeading}>
                <Info className="text-blue-500" /> Thông tin cá nhân
              </h2>
              <div className={styles.formGrid}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Họ</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, lastName: e.target.value }))
                      }
                      placeholder="Họ của bạn"
                      className="h-10 rounded border-border-brand focus:border-emerald-500/50 bg-transparent"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tên</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, firstName: e.target.value }))
                      }
                      placeholder="Tên của bạn"
                      className="h-10 rounded border-border-brand focus:border-emerald-500/50 bg-transparent"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Biệt danh (Hiển thị)</label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, displayName: e.target.value }))
                    }
                    placeholder="Tên hiển thị công khai"
                    className="h-10 border-border-brand focus:border-emerald-500/50 rounded bg-transparent"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Giới tính</label>
                  <div className={styles.genderRow}>
                    {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                      <label key={g} className={styles.genderOption}>
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={() =>
                            setFormData((p) => ({ ...p, gender: g }))
                          }
                        />
                        {g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : "Khác"}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tiểu sử</label>
                  <textarea
                    className="w-full px-4 py-3 bg-transparent border border-border-brand rounded text-text-primary placeholder:text-text-muted transition-all duration-200 outline-none focus:border-emerald-500/50 min-h-[140px] resize-none"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="Hãy viết vài dòng giới thiệu về bản thân bạn..."
                  />
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 px-12 rounded transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-emerald-600/20 uppercase text-lg tracking-widest flex items-center gap-3"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <CheckCircle2 size={24} />
                  )}
                  {saving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                </Button>
              </div>
            </motion.form>
          </div>
        </main>
      </motion.div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-surface-brand border-border-brand text-text-primary rounded max-w-md w-[95%] shadow-2xl p-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-rose-500 to-emerald-500" />
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2 uppercase tracking-tighter">
                <Lock className="text-rose-500" /> ĐỔI MẬT KHẨU
              </DialogTitle>
              <DialogDescription className="text-text-muted mt-2">
                Để bảo mật, vui lòng không chia sẻ mật khẩu mới với bất kỳ ai.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleChangePassword} className="space-y-6 mt-8">
              <div className={styles.formGroup}>
                <label className={styles.label}>Mật khẩu hiện tại</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="h-10 rounded border-border-brand focus:border-rose-500/50 bg-surface-elevated/50"
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mật khẩu mới</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  className="h-10 rounded border-border-brand focus:border-emerald-500/50 bg-surface-elevated/50"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Xác nhận mật khẩu mới</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="h-10 rounded border-border-brand focus:border-emerald-500/50 bg-surface-elevated/50"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded transition-all shadow-lg shadow-emerald-600/20 uppercase flex items-center justify-center gap-2"
                >
                  {saving && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  )}
                  {saving ? "ĐANG CẬP NHẬT..." : "XÁC NHẬN THAY ĐỔI"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
