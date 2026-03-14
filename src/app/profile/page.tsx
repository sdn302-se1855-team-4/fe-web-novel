"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Settings, 
  Lock, 
  Camera, 
  Save, 
  Info,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Mail,
  Coins
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  level: number;
  xp: number;
  role: string;
}

type Tab = 'account' | 'password';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Form states
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

    // Fetch existing basic info but use mock data for the new requested features
    apiFetch<UserProfile>("/auth/profile")
      .then((res) => {
        const mockUser: UserProfile = {
          ...res,
          firstName: "Vương",
          lastName: "Nguyễn",
          gender: "MALE",
          level: 15,
          xp: 4500,
          bio: res.bio || "Chào mừng bạn đến với hồ sơ của tôi! Tôi là một người yêu thích đọc truyện và sáng tạo nội dung.",
        };
        setUser(mockUser);
        setFormData({
          displayName: res.displayName || res.username,
          firstName: mockUser.firstName || "",
          lastName: mockUser.lastName || "",
          bio: mockUser.bio || "",
          gender: mockUser.gender,
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
    
    // Simulate API delay
    setTimeout(() => {
      showToast("Cập nhật thông tin thành công (Dữ liệu mẫu)", "success");
      setSaving(false);
    }, 800);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }
    setSaving(true);
    
    // Simulate API delay
    setTimeout(() => {
      showToast("Đổi mật khẩu thành công (Dữ liệu mẫu)", "success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaving(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  const nextLevelXp = user.level * 1000;
  const progress = (user.xp / nextLevelXp) * 100;

  return (
    <div className="page-wrapper">
      <div className={`container ${styles.page} ${styles.container}`}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <Settings size={18} /> Quản lý tài khoản
          </div>
          <nav className={styles.nav}>
            <button 
              className={`${styles.navBtn} ${activeTab === 'account' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <UserIcon size={20} /> Thông tin cá nhân
            </button>
            <button 
              className={`${styles.navBtn} ${activeTab === 'password' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <Lock size={20} /> Đổi mật khẩu
            </button>
          </nav>

          <div className="mt-8 border-t border-border-brand pt-6 space-y-4">
            <div className={styles.statBadge}>
              <span className={styles.statValue}>{user.level}</span>
              <span className={styles.statLabel}>Cấp Độ</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {activeTab === 'account' ? (
            <>
              {/* Header / Avatar */}
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrap}>
                  <img 
                    src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username} 
                    alt={user.username} 
                    className={styles.avatar}
                  />
                  <div className={styles.avatarOverlay} title="Đổi ảnh đại diện">
                    <Camera size={24} />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm bg-rose-500 hover:bg-rose-400 rounded-none">Chọn hình</button>
                <p className={styles.avatarWarning}>Dùng hình 18+ sẽ bị khóa tài khoản vĩnh viễn.</p>
              </div>

              {/* Progress Bar */}
              <div className={styles.levelSection}>
                <div className={styles.levelLabelRow}>
                  <span>Cấp {user.level}</span>
                  <span>Cấp {user.level + 1}</span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarFill} style={{ width: `${progress}%` }}>
                    <span className={styles.progressText}>{Math.floor(progress)}% (Hậu Kỳ)</span>
                  </div>
                </div>
              </div>

              {/* Form - Account Info */}
              <div className={styles.formSection}>
                <h2 className={styles.sectionHeading}><ShieldCheck className="text-emerald-500" /> Thông tin tài khoản</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Điểm:</label>
                    <div className="relative">
                       <Input value={user.xp} readOnly className="bg-surface-elevated pl-10 h-10 rounded-none" />
                       <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email:</label>
                    <div className="relative">
                       <Input value={user.email} readOnly className="bg-surface-elevated pl-10 h-10 rounded-none" />
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form - Personal Info */}
              <form onSubmit={handleUpdateProfile} className={styles.formSection}>
                <h2 className={styles.sectionHeading}><Info className="text-blue-500" /> Thông tin cá nhân</h2>
                <div className={styles.formGrid}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Họ</label>
                      <Input 
                        value={formData.lastName} 
                        onChange={e => setFormData(p => ({...p, lastName: e.target.value}))}
                        placeholder="Họ"
                        className="h-10 rounded-none"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Tên</label>
                      <Input 
                        value={formData.firstName} 
                        onChange={e => setFormData(p => ({...p, firstName: e.target.value}))}
                        placeholder="Tên"
                        className="h-10 rounded-none"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Biệt danh (Hiển thị)</label>
                    <Input 
                      value={formData.displayName} 
                      onChange={e => setFormData(p => ({...p, displayName: e.target.value}))}
                      placeholder="Hiển thị trên trang cá nhân"
                      className="h-10 border-emerald-500/20 rounded-none"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Giới tính</label>
                    <div className={styles.genderRow}>
                      <label className={styles.genderOption}>
                        <input 
                          type="radio" 
                          name="gender" 
                          value="MALE" 
                          checked={formData.gender === 'MALE'} 
                          onChange={e => setFormData(p => ({...p, gender: 'MALE'}))} 
                        />
                        Nam
                      </label>
                      <label className={styles.genderOption}>
                        <input 
                          type="radio" 
                          name="gender" 
                          value="FEMALE" 
                          checked={formData.gender === 'FEMALE'} 
                          onChange={e => setFormData(p => ({...p, gender: 'FEMALE'}))} 
                        />
                        Nữ
                      </label>
                      <label className={styles.genderOption}>
                        <input 
                          type="radio" 
                          name="gender" 
                          value="OTHER" 
                          checked={formData.gender === 'OTHER'} 
                          onChange={e => setFormData(p => ({...p, gender: 'OTHER'}))} 
                        />
                        Khác
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tiểu sử</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-surface-elevated border border-border-brand rounded-none text-text-primary placeholder:text-text-muted transition-all duration-200 outline-none focus:border-emerald-500/50 min-h-[100px]"
                      value={formData.bio}
                      onChange={e => setFormData(p => ({...p, bio: e.target.value}))}
                      placeholder="Giới thiệu về bản thân bạn..."
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={saving} className="btn-primary px-8 rounded-none">
                    {saving ? "Đang lưu..." : (
                      <>
                        <Save size={18} /> Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.formSection}>
              <h2 className={styles.sectionHeading}><Lock className="text-rose-500" /> Đổi mật khẩu</h2>
              <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mật khẩu hiện tại</label>
                  <Input 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData(p => ({...p, currentPassword: e.target.value}))}
                    className="h-12 rounded-none"
                    placeholder="••••••••"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mật khẩu mới</label>
                  <Input 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData(p => ({...p, newPassword: e.target.value}))}
                    className="h-12 rounded-none"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Xác nhận mật khẩu mới</label>
                  <Input 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData(p => ({...p, confirmPassword: e.target.value}))}
                    className="h-12 rounded-none"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="btn-primary px-10 bg-emerald-600 rounded-none">
                    {saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
