"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, ArrowLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setTokens(data.accessToken, data.refreshToken, data.user?.role);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-10 overflow-hidden bg-bg-brand">
      {/* Immersive Background Brushes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#10b981]/5 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 group transition-colors"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Quay lại trang chủ</span>
        </Link>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-xl shadow-emerald-500/5">
            <BookOpen size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">BestNovelVN</h2>
            <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest mt-0.5">Premium Portal</p>
          </div>
        </div>

        <Card className="bg-surface-brand border-border-brand backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-2">
          <CardHeader className="space-y-2 pb-8 pt-8 px-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Chào mừng trở lại!
            </CardTitle>
            <CardDescription className="text-text-muted text-sm">
              Đăng nhập để khám phá hàng ngàn câu chuyện hấp dẫn.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center font-medium"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-text-secondary text-sm font-semibold ml-1">Email</Label>
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
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-text-secondary text-sm font-semibold">Mật khẩu</Label>
                    <Link href="#" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                      Quên mật khẩu?
                    </Link>
                  </div>
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
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={20} />
                    Đăng nhập ngay
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-border-brand">
              <p className="text-text-muted text-sm">
                Bạn chưa có tài khoản?{" "}
                <Link href="/register" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                  Đăng ký miễn phí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
