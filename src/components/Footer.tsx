import Link from "next/link";
import { BookOpen } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <BookOpen size={22} />
          <span className={styles.brandName}>BestNovelVN</span>
        </div>
        <nav className={styles.links}>
          <Link href="/stories">Duyệt truyện</Link>
          <Link href="/login">Đăng nhập</Link>
          <Link href="/register">Đăng ký</Link>
        </nav>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} BestNovelVN. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
