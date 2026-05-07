import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-nova text-white hover:bg-nova-hover border-transparent font-medium shadow-[0_0_14px_rgba(255,138,31,0.30)] hover:shadow-[0_0_20px_rgba(255,138,31,0.45)]",
  secondary: "bg-bg-3 hover:bg-bg-4 text-text-primary border-border hover:border-border-strong",
  ghost:     "bg-transparent hover:bg-bg-3 text-text-secondary hover:text-text-primary border-transparent",
  danger:    "bg-danger/10 hover:bg-danger/20 text-danger border-danger/20 hover:border-danger/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-xs gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-md border transition-all focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-30 disabled:cursor-not-allowed tracking-wide",
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
