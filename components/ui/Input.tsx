import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full bg-bg-3 border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1",
            error
              ? "border-danger/40 focus:border-danger focus:ring-danger/20"
              : "border-border focus:border-gold/40 focus:ring-gold/10",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
