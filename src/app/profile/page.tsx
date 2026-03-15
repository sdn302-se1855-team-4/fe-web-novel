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
    <div className="page-wrapper min-h-screen pt-4 pb-16 px-4 sm:px-6 bg-linear-to-br from-emerald-500/5 via-transparent to-blue-500/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[850px] mx-auto bg-surface-brand/70 backdrop-blur-2xl border border-border-brand/50 p-6 sm:p-14 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-blue-500" />

        <div className="flex flex-col gap-12">
          {/* Avatar section */}
          <section className="flex flex-col items-center gap-6">
            <div className="relative group w-36 h-36 p-1 bg-linear-to-br from-emerald-500 to-blue-500 rounded-full shadow-xl shadow-emerald-500/20">
              <img
                src={
                  previewImage ||
                  user.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username
                }
                alt={user.username}
                className="w-full h-full object-cover border-4 border-surface-brand rounded-full transition-all duration-500 group-hover:brightness-50"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white"
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

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs"
              >
                <Upload size={18} /> Chọn hình
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
                className="flex-1 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 font-black rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <Lock size={18} /> Đổi mật khẩu
              </Button>
            </div>
            <p className="text-[10px] text-text-muted italic text-center max-w-sm font-medium opacity-80">
              Lưu ý: Hình ảnh đại diện phải phù hợp với nội dung văn hóa và tiêu chuẩn cộng đồng.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-12">
            {/* Account Info (read-only) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-wider pb-3 border-b border-border-brand/30">
                <ShieldCheck className="text-emerald-500" size={20} /> Thông tin tài khoản
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Tên đăng nhập</label>
                  <div className="relative">
                    <Input
                      value={user.username}
                      readOnly
                      className="bg-emerald-500/5 border-emerald-500/20 pl-12 h-11 rounded-xl font-bold text-text-muted cursor-default"
                    />
                    <UserIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                      size={18}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Địa chỉ Email</label>
                  <div className="relative">
                    <Input
                      value={user.email}
                      readOnly
                      className="bg-emerald-500/5 border-emerald-500/20 pl-12 h-11 rounded-xl font-bold text-text-muted cursor-default"
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
              className="space-y-6"
            >
              <h2 className="text-lg font-black text-text-primary flex items-center gap-3 uppercase tracking-wider pb-3 border-b border-border-brand/30">
                <Info className="text-blue-500" size={20} /> Thông tin cá nhân
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Họ</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, lastName: e.target.value }))
                      }
                      placeholder="Họ của bạn"
                      className="h-11 rounded-xl border-border-brand focus:border-emerald-500/50 bg-transparent focus:bg-surface-elevated/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Tên</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, firstName: e.target.value }))
                      }
                      placeholder="Tên của bạn"
                      className="h-11 rounded-xl border-border-brand focus:border-emerald-500/50 bg-transparent focus:bg-surface-elevated/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Biệt danh (Tên hiển thị)</label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, displayName: e.target.value }))
                    }
                    placeholder="Tên hiển thị công khai trên ứng dụng"
                    className="h-11 border-border-brand focus:border-emerald-500/50 rounded-xl bg-transparent focus:bg-surface-elevated/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Giới tính</label>
                  <div className="flex gap-8 p-3 px-6 bg-surface-elevated/20 border border-border-brand/30 rounded-xl">
                    {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                      <label key={g} className="flex items-center gap-2 text-sm font-bold text-text-primary cursor-pointer hover:text-emerald-500 transition-colors">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={() =>
                            setFormData((p) => ({ ...p, gender: g }))
                          }
                          className="w-4 h-4 accent-emerald-500"
                        />
                        {g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : "Khác"}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Tiểu sử cá nhân</label>
                  <textarea
                    className="w-full px-5 py-4 bg-transparent border border-border-brand/60 rounded-2xl text-text-primary placeholder:text-text-muted transition-all duration-300 outline-none focus:border-emerald-500/50 min-h-[140px] resize-none focus:bg-surface-elevated/20 text-sm leading-relaxed"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="Hãy viết vài dòng giới thiệu về bản thân bạn để mọi người biết thêm nhé..."
                  />
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 px-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-emerald-600/20 uppercase text-lg tracking-widest flex items-center gap-3 border-none"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <CheckCircle2 size={24} />
                  )}
                  {saving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                </Button>
              </div>
            </motion.form>
          </div>
        </div>
      </motion.div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-surface-brand/95 backdrop-blur-3xl border-border-brand text-text-primary rounded-[2rem] max-w-md w-[95%] shadow-2xl p-0 overflow-hidden">
          <div className="h-2 bg-linear-to-r from-rose-500 to-emerald-500" />
          <div className="p-8 sm:p-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                <Lock className="text-rose-500" size={24} /> ĐỐI MẬT KHẨU
              </DialogTitle>
              <DialogDescription className="text-text-muted mt-2 font-medium">
                Để bảo mật tốt nhất, vui lòng sử dụng mật khẩu mạnh và không chia sẻ với bất kỳ ai.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleChangePassword} className="space-y-6 mt-10">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border-border-brand focus:border-rose-500/50 bg-surface-elevated/40 px-4 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Mật khẩu mới</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border-border-brand focus:border-emerald-500/50 bg-surface-elevated/40 px-4 transition-all"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border-border-brand focus:border-emerald-500/50 bg-surface-elevated/40 px-4 transition-all"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-600/20 uppercase flex items-center justify-center gap-3 border-none"
                >
                  {saving && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
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
