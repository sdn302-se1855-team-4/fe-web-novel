"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, UserPlus, BookOpen, PenTool, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-10 overflow-hidden bg-[#020617]">
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
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 group transition-colors"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Quay lại đăng nhập</span>
        </Link>

        <Card className="bg-white/[0.03] border-white/5 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 pb-8 pt-10 px-8 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4 mx-auto">
              <UserPlus size={28} />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight text-white uppercase italic" style={{ fontFamily: "var(--font-heading)" }}>
              Gia nhập cộng đồng
            </CardTitle>
            <CardDescription className="text-slate-400 text-base max-w-sm mx-auto">
              Bắt đầu hành trình đọc và viết những câu chuyện tuyệt vời nhất tại BestNovelVN.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
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
                  <Label htmlFor="name" className="text-slate-300 text-sm font-bold ml-1">Tên hiển thị</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="name"
                      placeholder="Tên của bạn"
                      className="pl-12 h-14 bg-white/5 border-white/10 hover:border-white/20 transition-all rounded-2xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm font-bold ml-1">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-12 h-14 bg-white/5 border-white/10 hover:border-white/20 transition-all rounded-2xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-bold ml-1">Mật khẩu</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-white/5 border-white/10 hover:border-white/20 transition-all rounded-2xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-bold ml-1">Xác nhận mật khẩu</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-white/5 border-white/10 hover:border-white/20 transition-all rounded-2xl"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-300 text-sm font-bold ml-1">Chọn vai trò của bạn</Label>
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
                        "relative flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 group",
                        role === item.id 
                          ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                          : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        role === item.id ? "bg-emerald-500 text-[#020617]" : "bg-white/5 text-slate-400 group-hover:text-emerald-500"
                      )}>
                        <item.icon size={24} />
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "font-bold text-sm uppercase tracking-wide",
                          role === item.id ? "text-emerald-500" : "text-white"
                        )}>{item.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-[2rem] bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-black text-xl shadow-2xl shadow-emerald-500/30 transition-all duration-300 transform active:scale-[0.97] mt-4"
                disabled={loading}
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

            <div className="mt-10 text-center pt-8 border-t border-white/5">
              <p className="text-slate-400 text-base font-medium">
                Đã là thành viên?{" "}
                <Link href="/login" className="font-black text-emerald-500 hover:text-emerald-400 transition-colors ml-1 uppercase underline decoration-2 underline-offset-4">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
