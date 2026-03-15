"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/firebase";
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
  const [googleLoading, setGoogleLoading] = useState(false);

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
      router.push("/");
    } catch (err) {
      // Ignore popup closed by user
      if (err instanceof Error && err.message.includes("popup-closed")) return;
      setError(err instanceof Error ? err.message : "Đăng nhập Google thất bại");
    } finally {
      setGoogleLoading(false);
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

        <div className="mb-10">
          <Logo iconSize={32} textSize="2xl" showTagline />
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
                disabled={loading || googleLoading}
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

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border-brand" />
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider">hoặc</span>
              <div className="flex-1 h-px bg-border-brand" />
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-2xl border-border-brand bg-surface-elevated hover:bg-surface-brand hover:border-emerald-500/30 text-text-primary font-semibold text-base transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50"
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
                  Đăng nhập bằng Google
                </div>
              )}
            </Button>

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
