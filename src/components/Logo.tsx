import React from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  showTagline?: boolean;
}

export default function Logo({ 
  className, 
  iconSize = 24, 
  textSize = "lg",
  showTagline = false 
}: LogoProps) {
  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
  };

  return (
    <motion.div 
      className={cn("flex items-center gap-3 group select-none", className)}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* Icon Wrapper with Layered Glassmorphism */}
      <div className="relative shrink-0">
        <motion.div 
          className="relative z-10 p-2 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20"
          variants={{
            rest: { scale: 1, rotate: 0 },
            hover: { scale: 1.1, rotate: -5 }
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <BookOpen size={iconSize} strokeWidth={2.5} />
        </motion.div>
        
        {/* Decorative Glow background */}
        <motion.div 
          className="absolute inset-0 bg-emerald-400 blur-lg opacity-40 rounded-full"
          variants={{
            rest: { scale: 0.8, opacity: 0.2 },
            hover: { scale: 1.2, opacity: 0.4 }
          }}
        />

        {/* Floating Sparkle/Dot */}
        <motion.div 
          className="absolute -top-1 -right-1 z-20 w-4 h-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm"
          variants={{
            rest: { y: 0 },
            hover: { y: -4, x: 2 }
          }}
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </motion.div>
      </div>

      {/* Text Branding */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline overflow-hidden">
          <motion.span 
            className={cn(
              "font-black tracking-tighter text-text-primary leading-none",
              textSizes[textSize]
            )}
            variants={{
              rest: { y: 0 },
              hover: { y: 0 }
            }}
          >
            Chapter
          </motion.span>
          <motion.span 
            className={cn(
              "font-black tracking-tighter leading-none ml-[2px]",
              textSizes[textSize],
              "bg-clip-text text-transparent bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-400"
            )}
            variants={{
              rest: { x: 0 },
              hover: { x: 2 }
            }}
          >
            One
          </motion.span>
        </div>
        
        {showTagline && (
          <motion.span 
            className="text-[10px] font-black text-text-muted/80 uppercase tracking-[0.3em] leading-none mt-1.5 ml-[2px]"
            variants={{
              rest: { opacity: 0.6, letterSpacing: "0.3em" },
              hover: { opacity: 1, letterSpacing: "0.35em", color: "var(--color-primary-brand)" }
            }}
          >
            Premium Novel
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
