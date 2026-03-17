"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (otp.length !== 6) {
      setError("Mã OTP phải có 6 chữ số");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardContent className="px-6 pb-8">
      {success ? (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center space-y-4 py-4"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-emerald-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Thành công!</h3>
          <p className="text-text-muted text-sm">
            Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng về trang đăng nhập sau giây lát...
          </p>
          <div className="pt-4">
            <Link 
              href="/login"
              className="px-6 py-2 bg-emerald-500 text-[#020617] font-bold rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </motion.div>
      ) : (
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
              <Label className="text-text-secondary text-sm font-semibold ml-1">Email</Label>
              <Input
                value={email}
                disabled
                className="h-14 bg-surface-elevated/50 border-border-brand rounded-2xl text-text-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-text-secondary text-sm font-semibold ml-1">Mã xác thực (6 chữ số)</Label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="pl-12 h-14 bg-surface-elevated border-border-brand hover:border-emerald-500/30 transition-all rounded-2xl text-text-primary placeholder:text-text-muted tracking-[0.5em] font-mono text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-text-secondary text-sm font-semibold ml-1">Mật khẩu mới</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-14 bg-surface-elevated border-border-brand hover:border-emerald-500/30 transition-all rounded-2xl text-text-primary placeholder:text-text-muted"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-text-secondary text-sm font-semibold ml-1">Xác nhận mật khẩu mới</Label>
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

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} />
                Cập nhật mật khẩu
              </div>
            )}
          </Button>
        </form>
      )}

      <div className="mt-8 text-center pt-6 border-t border-border-brand">
        <p className="text-text-muted text-sm">
          Thay đổi ý định?{" "}
          <Link href="/login" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </CardContent>
  );
}

export default function ResetPasswordPage() {
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
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-8 group transition-colors"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Quay lại</span>
        </Link>

        <div className="mb-10">
          <Logo iconSize={32} textSize="2xl" showTagline />
        </div>

        <Card className="bg-surface-brand border-border-brand backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-2">
          <CardHeader className="space-y-2 pb-8 pt-8 px-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Đặt lại mật khẩu
            </CardTitle>
            <CardDescription className="text-text-muted text-sm">
              Sử dụng mã OTP đã nhận được để đặt mật khẩu mới.
            </CardDescription>
          </CardHeader>

          <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </motion.div>
    </div>
  );
}
