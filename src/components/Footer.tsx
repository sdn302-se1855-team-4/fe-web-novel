"use client";

import Link from "next/link";
import {
  Facebook,
  MessageSquare,
  Send,
  Lightbulb,
  ChevronRight,
  Github,
  Twitter,
  Instagram,
  Mail,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import Logo from "./Logo";
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
    <footer className="relative bg-bg-brand border-t border-border-brand/50 pt-20 pb-10 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-64 -mb-64" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -ml-32 -mt-32" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand Column */}
          <motion.div
            className="lg:col-span-4 space-y-6"
            variants={itemVariants}
          >
            <Logo textSize="xl" showTagline />
            <p className="text-text-muted text-sm leading-relaxed max-w-sm">
              Nền tảng đọc truyện online hàng đầu với hàng ngàn tác phẩm hấp
              dẫn, được chọn lọc kỹ lưỡng, cập nhật liên tục mỗi ngày để mang
              lại trải nghiệm tốt nhất cho bạn.
            </p>
            <div className="flex items-center gap-4">
              {[
                {
                  icon: Facebook,
                  href: "https://facebook.com",
                  color: "hover:text-[#1877F2]",
                },
                {
                  icon: Twitter,
                  href: "https://twitter.com",
                  color: "hover:text-[#1DA1F2]",
                },
                {
                  icon: Instagram,
                  href: "https://instagram.com",
                  color: "hover:text-[#E4405F]",
                },
                {
                  icon: Github,
                  href: "https://github.com",
                  color: "hover:text-text-primary",
                },
              ].map((social, idx) => (
                <Link
                  key={idx}
                  href={social.href}
                  target="_blank"
                  className={cn(
                    "w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted transition-all duration-300 hover:scale-110 hover:shadow-lg",
                    social.color,
                  )}
                >
                  <social.icon size={20} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            variants={itemVariants}
          >
            <h4 className="text-sm font-black text-text-primary uppercase tracking-widest italic">
              Khám phá
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Duyệt truyện", href: "/stories" },
                { label: "Truyện mới", href: "/stories?sort=Mới nhất" },
                { label: "Xếp hạng", href: "/stories?sort=Xem nhiều nhất" },
                { label: "Hoàn thành", href: "/stories?status=Hoàn thành" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-emerald-500 transition-colors flex items-center group"
                  >
                    <ChevronRight
                      size={14}
                      className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-emerald-500"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            variants={itemVariants}
          >
            <h4 className="text-sm font-black text-text-primary uppercase tracking-widest italic">
              Hỗ trợ
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Đăng nhập", href: "/login" },
                { label: "Đăng ký", href: "/register" },
                { label: "Điều khoản", href: "#" },
                { label: "Bảo mật", href: "#" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-emerald-500 transition-colors flex items-center group"
                  >
                    <ChevronRight
                      size={14}
                      className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-emerald-500"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div
            className="lg:col-span-4 space-y-6"
            variants={itemVariants}
          >
            <h4 className="text-sm font-black text-text-primary uppercase tracking-widest italic">
              Liên hệ & Hợp tác
            </h4>
            <div className="bg-surface-elevated/50 border border-border-brand/50 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
              <Link
                href="mailto:contact@chapterone.com"
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Email hỗ trợ
                  </p>
                  <p className="text-sm font-bold text-text-primary group-hover:text-emerald-500 transition-colors">
                    contact@chapterone.com
                  </p>
                </div>
              </Link>

              <Link
                href="https://t.me"
                target="_blank"
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] group-hover:bg-[#0088cc] group-hover:text-white transition-all duration-300">
                  <Send size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Telegram
                  </p>
                  <p className="text-sm font-bold text-text-primary group-hover:text-[#0088cc] transition-colors">
                    @chapterone_admin
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 p-3 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <Lightbulb size={16} className="text-emerald-500 animate-pulse" />
              <p className="text-xs font-medium text-text-muted">
                Bạn có ý tưởng hay góp ý?{" "}
                <Link href="#" className="text-emerald-500 hover:underline">
                  Gửi cho chúng tôi
                </Link>
              </p>
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
