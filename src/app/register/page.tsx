"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, Mail, Lock, UserPlus, BookOpen, PenTool, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

const TOS_CONTENT = {
  READER: {
    title: "Điều khoản Độc giả",
    content: (
      <div className="space-y-4">
        <p>Chào mừng bạn đến với cộng đồng độc giả của ChapterOne. Bằng cách đăng ký, bạn đồng ý với các điều khoản sau:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Tôn trọng bản quyền:</strong> Không sao chép, chia sẻ trái phép nội dung tác phẩm dưới mọi hình thức.</li>
          <li><strong>Quy tắc cộng đồng:</strong> Bình luận văn minh, không gây hấn, xúc phạm hoặc vi phạm tiêu chuẩn đạo đức xã hội.</li>
          <li><strong>Bảo mật tài khoản:</strong> Bạn có trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra trên tài khoản của mình.</li>
          <li><strong>Quyền lợi:</strong> Được tiếp cận kho tàng truyện phong phú và tham gia các sự kiện dành riêng cho độc giả.</li>
        </ul>
      </div>
    )
  },
  WRITER: {
    title: "Điều khoản Tác giả",
    content: (
      <div className="space-y-4">
        <p>Dành cho các nhà sáng tạo nội dung tại ChapterOne. Bằng cách đăng ký vai trò Tác giả, bạn cam kết:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Bản quyền gốc:</strong> Cam kết nội dung đăng tải là do bạn sáng tác hoặc có quyền sở hữu hợp pháp. ChapterOne không chấp nhận đạo văn.</li>
          <li><strong>Nội dung hợp lệ:</strong> Không đăng tải nội dung vi phạm pháp luật, chính trị, sắc tộc hoặc các nội dung đồi trụy không phù hợp.</li>
          <li><strong>Chia sẻ doanh thu:</strong> Đồng ý với chính sách trả nhuận bút và phân chia lợi nhuận từ hệ thống đăng ký của độc giả.</li>
          <li><strong>Duy trì tác phẩm:</strong> Cam kết không xóa tác phẩm đang trong quá trình thương mại hóa mà không có sự đồng ý của nền tảng.</li>
        </ul>
      </div>
    )
  }
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("READER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTOS, setShowTOS] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!agreed) {
      setError("Bạn phải đồng ý với điều khoản dịch vụ để đăng ký");
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
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const data = await apiFetch<LoginResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      setTokens(data.accessToken, data.refreshToken, data.user?.role);
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("popup-closed")) return;
      setError(err instanceof Error ? err.message : "Đăng ký Google thất bại");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-10 overflow-hidden bg-bg-brand">
      {/* Immersive Background Brushes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#10b981]/5 blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl py-12"
      >
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 group transition-colors"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Quay lại đăng nhập</span>
        </Link>

        <Card className="bg-surface-brand border-border-brand backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 pb-8 pt-10 px-8 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4 mx-auto">
              <UserPlus size={28} />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight text-text-primary uppercase italic" style={{ fontFamily: "var(--font-heading)" }}>
              Gia nhập cộng đồng
            </CardTitle>
            <CardDescription className="text-text-muted text-base max-w-sm mx-auto">
              Bắt đầu hành trình đọc và viết những câu chuyện tuyệt vời nhất tại ChapterOne.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            {/* Google Sign-up Button first */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-2xl border-border-brand bg-surface-elevated hover:bg-surface-brand hover:border-emerald-500/30 text-text-primary font-semibold text-base transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 mb-6"
              disabled={googleLoading || loading}
              onClick={handleGoogleLogin}
            >
              {googleLoading ? (
                <div className="w-6 h-6 border-2 border-text-muted/30 border-t-text-primary rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Đăng ký bằng Google
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border-brand" />
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider">hoặc đăng ký bằng email</span>
              <div className="flex-1 h-px bg-border-brand" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm text-center font-bold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-secondary text-sm font-bold ml-1">Tên hiển thị</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="name"
                      placeholder="Tên của bạn"
                      className="pl-12 h-14 bg-surface-elevated border-border-brand hover:border-emerald-500/30 transition-all rounded-2xl text-text-primary placeholder:text-text-muted"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-text-secondary text-sm font-bold ml-1">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-12 h-14 bg-surface-elevated border-border-brand hover:border-emerald-500/30 transition-all rounded-2xl text-text-primary placeholder:text-text-muted"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-text-secondary text-sm font-bold ml-1">Mật khẩu</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-surface-elevated border-border-brand hover:border-emerald-500/30 transition-all rounded-2xl text-text-primary placeholder:text-text-muted"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-text-secondary text-sm font-bold ml-1">Xác nhận mật khẩu</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-surface-elevated border-border-brand hover:border-emerald-500/30 transition-all rounded-2xl text-text-primary placeholder:text-text-muted"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-text-secondary text-sm font-bold ml-1">Chọn vai trò của bạn</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "READER", title: "Độc giả", desc: "Thỏa sức khám phá", icon: BookOpen },
                    { id: "WRITER", title: "Tác giả", desc: "Sáng tác tác phẩm", icon: PenTool },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-3 p-6 rounded-4xl border-2 transition-all duration-300 group",
                        role === item.id 
                          ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                          : "bg-surface-elevated border-border-brand hover:border-emerald-500/30 hover:bg-emerald-500/5 text-text-muted"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl transition-all duration-300",
                        role === item.id ? "bg-emerald-500 text-white" : "bg-surface-brand text-text-muted group-hover:text-emerald-500"
                      )}>
                        <item.icon size={24} />
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "font-bold text-sm uppercase tracking-wide transition-colors",
                          role === item.id ? "text-emerald-500" : "text-text-secondary group-hover:text-emerald-500"
                        )}>{item.title}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight mt-1">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 px-1 mt-6">
                <input 
                  type="checkbox" 
                  id="agreed"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-md border-border-brand bg-surface-elevated text-emerald-500 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-500"
                />
                <Label htmlFor="agreed" className="text-text-muted text-sm font-medium cursor-pointer select-none leading-relaxed">
                  Tôi đã đọc và đồng ý với{" "}
                  <button 
                    type="button"
                    onClick={() => setShowTOS(true)}
                    className="text-emerald-500 hover:text-emerald-400 font-bold underline underline-offset-4 decoration-2 transition-colors inline-block"
                  >
                    điều khoản dịch vụ
                  </button>
                  {" "}dành cho {role === "READER" ? "Độc giả" : "Tác giả"}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-4xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-black text-xl shadow-2xl shadow-emerald-500/30 transition-all duration-300 transform active:scale-[0.97] mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                disabled={loading || googleLoading || !agreed}
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    <UserPlus size={24} strokeWidth={3} />
                    Tạo tài khoản ngay
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center pt-8 border-t border-border-brand">
              <p className="text-text-muted text-base font-medium">
                Đã là thành viên?{" "}
                <Link href="/login" className="font-black text-emerald-500 hover:text-emerald-400 transition-colors ml-1 uppercase underline decoration-2 underline-offset-4">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showTOS} onOpenChange={setShowTOS}>
        <DialogContent className="max-w-2xl bg-surface-brand border-border-brand text-text-primary rounded-[2rem] overflow-hidden">
          <DialogHeader className="pb-4 border-b border-border-brand">
            <DialogTitle className="text-2xl font-black text-emerald-500 italic uppercase italic" style={{ fontFamily: "var(--font-heading)" }}>
              {TOS_CONTENT[role as keyof typeof TOS_CONTENT].title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-text-secondary leading-relaxed max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar text-base font-medium">
            {TOS_CONTENT[role as keyof typeof TOS_CONTENT].content}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-border-brand">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setShowTOS(false)}
              className="h-12 rounded-xl border-border-brand hover:bg-surface-elevated text-text-primary px-8"
            >
              Hủy bỏ
            </Button>
            <Button 
              type="button"
              onClick={() => {
                setAgreed(true);
                setShowTOS(false);
              }}
              className="h-12 bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-bold rounded-xl px-10 shadow-lg shadow-emerald-500/20"
            >
              Tôi đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
