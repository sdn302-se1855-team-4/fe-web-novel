"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Facebook,
  Twitter,
  Instagram,
  Github,
  ChevronRight,
  Mail,
  Send,
  Heart,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
export default function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="relative bg-surface-brand border-t border-border py-16 mt-auto overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand & Mission - 4 Columns */}
          <motion.div className="lg:col-span-4 space-y-6" variants={itemVariants}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen size={22} className="text-white" />
              </div>
              <span className="text-2xl font-black text-text-primary tracking-tighter">BestNovel<span className="text-emerald-500">VN</span></span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm font-medium">
              Nền tảng đọc truyện online hàng đầu với hàng ngàn tác phẩm hấp dẫn, cập nhật liên tục mỗi ngày. Trải nghiệm đọc truyện cao cấp, mượt mà trên mọi thiết bị.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Facebook, href: "https://facebook.com", color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30" },
                { icon: Twitter, href: "https://twitter.com", color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30" },
                { icon: Instagram, href: "https://instagram.com", color: "hover:bg-[#E4405F]/10 hover:text-[#E4405F] hover:border-[#E4405F]/30" },
                { icon: Github, href: "https://github.com", color: "hover:bg-text-primary/10 hover:text-text-primary hover:border-text-primary/30" },
              ].map((social, idx) => (
                <Link
                  key={idx}
                  href={social.href}
                  target="_blank"
                  className={cn(
                    "w-10 h-10 rounded-lg bg-surface-elevated/50 border border-border-brand/50 flex items-center justify-center text-text-muted transition-all duration-300 hover:-translate-y-1",
                    social.color
                  )}
                >
                  <social.icon size={18} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Links - 2 Columns */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] opacity-50">
              Khám phá
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Duyệt truyện", href: "/stories" },
                { label: "Truyện mới", href: "/stories?sort=Mới nhất" },
                { label: "Xếp hạng", href: "/stories?sort=Xem nhiều nhất" },
                { label: "Hoàn thành", href: "/stories?status=Hoàn thành" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-text-secondary hover:text-emerald-500 transition-colors flex items-center group w-fit"
                  >
                    <span className="w-0 group-hover:w-3 overflow-hidden transition-all duration-300 mr-0 group-hover:mr-2 text-emerald-500">
                      <ChevronRight size={14} />
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support - 2 Columns */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] opacity-50">
              Hỗ trợ
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Đăng nhập", href: "/login" },
                { label: "Đăng ký", href: "/register" },
                { label: "Điều khoản", href: "#" },
                { label: "Bảo mật", href: "#" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-text-secondary hover:text-emerald-500 transition-colors flex items-center group w-fit"
                  >
                    <span className="w-0 group-hover:w-3 overflow-hidden transition-all duration-300 mr-0 group-hover:mr-2 text-emerald-500">
                      <ChevronRight size={14} />
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact & Feedback - 4 Columns */}
          <motion.div className="lg:col-span-4 space-y-6" variants={itemVariants}>
            <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] opacity-50">
              Liên hệ & Hợp tác
            </h4>
            <div className="bg-surface-elevated/40 backdrop-blur-md border border-border-brand/40 rounded-3xl p-6 lg:p-7 space-y-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full transform translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-150 duration-700" />
              
              <Link href="mailto:contact@chapterone.com" className="flex items-center gap-4 group/item relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300 shadow-sm border border-emerald-500/10">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Email hỗ trợ</p>
                  <p className="text-sm font-extrabold text-text-primary group-hover/item:text-emerald-500 transition-colors">contact@chapterone.com</p>
                </div>
              </Link>

              <Link href="https://t.me" target="_blank" className="flex items-center gap-4 group/item relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] group-hover/item:bg-[#0088cc] group-hover/item:text-white transition-all duration-300 shadow-sm border border-[#0088cc]/10">
                  <Send size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Telegram Admin</p>
                  <p className="text-sm font-extrabold text-text-primary group-hover/item:text-[#0088cc] transition-colors">@chapterone_admin</p>
                </div>
              </Link>

              <div className="pt-2">
                 <div className="flex items-center gap-3 p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Lightbulb size={16} className="text-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] font-bold text-text-muted leading-tight">
                    Bạn có ý tưởng hay góp ý?{" "}
                    <Link href="#" className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-0.5">
                      Gửi cho chúng tôi <ChevronRight size={10} />
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-brand/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <span>© {currentYear} ChapterOne.</span>
            <span className="hidden md:inline">•</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted/60 uppercase tracking-widest">
            Made with{" "}
            <Heart size={10} className="text-rose-500 fill-rose-500 mx-1" /> for
            Novel Lovers
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
