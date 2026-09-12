"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";

type Variant = "primary" | "ghost" | "danger" | "gold";

const variants: Record<Variant, string> = {
  primary:
    "text-deep bg-gradient-to-b from-[#5ef0d9] to-[#17b4c6] shadow-[0_8px_24px_-8px_rgba(76,230,207,.75)]",
  gold: "text-deep bg-gradient-to-b from-[#ffd469] to-[#ff972e] shadow-[0_8px_24px_-8px_rgba(255,180,60,.8)]",
  ghost: "text-text bg-white/5 border border-white/15 hover:bg-white/10",
  danger: "text-text bg-gradient-to-b from-[#ff7187] to-[#e03a55] shadow-[0_8px_24px_-8px_rgba(255,92,116,.7)]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
};

const GameButton = forwardRef<HTMLButtonElement, Props>(function GameButton(
  { variant = "primary", size = "md", className = "", children, disabled, ...props },
  ref
) {
  const reduceMotion = useReducedMotion();
  const sizing = size === "sm" ? "px-3.5 py-2 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={disabled || reduceMotion ? undefined : { y: -2, scale: 1.03 }}
      whileTap={disabled || reduceMotion ? undefined : { y: 2, scale: 0.96 }}
      transition={SPRING.snappy}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide
        disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${variants[variant]} ${sizing} ${className}`}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
});

export default GameButton;
