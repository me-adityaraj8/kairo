import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-gold text-bg border-gold hover:bg-[#ffd766]",
  ghost: "bg-transparent text-text border-border hover:bg-border/40",
  danger: "bg-danger text-text border-danger hover:bg-[#ff6b7d]",
};

export default function PixelButton({
  variant = "primary",
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`border-[3px] px-4 py-2 font-pixel text-[10px] uppercase tracking-wider transition-transform
        active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0
        ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
