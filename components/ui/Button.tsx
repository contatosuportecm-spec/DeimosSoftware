import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-[#FF6B00] text-black hover:bg-[#FF7A1A] border-transparent font-bold shadow-[0_0_18px_rgba(255,107,0,0.35)] hover:shadow-[0_0_32px_rgba(255,107,0,0.55),0_0_10px_rgba(255,107,0,0.35)] active:scale-[0.96]",
  secondary: "bg-bg-3 hover:bg-bg-4 text-text-primary border-border hover:border-border-strong",
  ghost:     "bg-transparent hover:bg-bg-3 text-text-secondary hover:text-text-primary border-transparent",
  danger:    "bg-danger/10 hover:bg-danger/20 text-danger border-danger/20 hover:border-danger/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs gap-1.5",
  md: "px-6 py-3 text-xs gap-2",
  lg: "px-8 py-4 text-sm gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-[9px] border transition-[background,box-shadow,transform] duration-400 focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-30 disabled:cursor-not-allowed tracking-wide",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
