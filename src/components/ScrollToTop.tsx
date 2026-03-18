"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[99] w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-[#020617] shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all duration-300 group"
          aria-label="Cuộn lên đầu trang"
        >
          <ArrowUp size={20} className="group-hover:-translate-y-1 transition-transform" strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
