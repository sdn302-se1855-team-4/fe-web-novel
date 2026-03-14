import Link from "next/link";
import { BookOpen, Facebook, MessageSquare, Send, Lightbulb } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className={styles.brand}>
              <BookOpen size={24} className="text-emerald-500" />
              <span className="text-xl font-bold text-text-primary">BestNovelVN</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Nền tảng đọc truyện online hàng đầu với hàng ngàn tác phẩm hấp dẫn, cập nhật liên tục mỗi ngày.
            </p>
          </div>

          {/* Community Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Cộng đồng</h4>
            <div className="flex flex-col gap-3">
              <Link href="https://facebook.com" target="_blank" className="flex items-center gap-3 text-sm text-text-secondary hover:text-emerald-500 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center group-hover:bg-emerald-500/10">
                  <Facebook size={16} />
                </div>
                Facebook Fanpage
              </Link>
              <Link href="https://discord.gg" target="_blank" className="flex items-center gap-3 text-sm text-text-secondary hover:text-emerald-500 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center group-hover:bg-emerald-500/10">
                  <MessageSquare size={16} />
                </div>
                Discord Server
              </Link>
            </div>
          </div>

          {/* Contact & Ads */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Liên hệ quảng cáo</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="w-8 h-8 rounded-lg bg-slate-500/5 flex items-center justify-center">
                  <Lightbulb size={16} />
                </div>
                <span>Hợp tác & Truyền thông</span>
              </div>
              <Link href="https://t.me" target="_blank" className="flex items-center gap-3 text-sm text-text-secondary hover:text-emerald-500 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-[#0088cc]/5 flex items-center justify-center group-hover:bg-[#0088cc]/10">
                  <Send size={16} className="text-[#0088cc]" />
                </div>
                Telegram Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border-brand/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex items-center gap-6">
            <Link href="/stories" className="text-xs font-bold text-text-muted hover:text-emerald-500 uppercase tracking-tight">Duyệt truyện</Link>
            <Link href="/login" className="text-xs font-bold text-text-muted hover:text-emerald-500 uppercase tracking-tight">Đăng nhập</Link>
            <Link href="/register" className="text-xs font-bold text-text-muted hover:text-emerald-500 uppercase tracking-tight">Đăng ký</Link>
          </nav>
          <p className="text-xs text-text-muted font-medium">
            © {new Date().getFullYear()} BestNovelVN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
