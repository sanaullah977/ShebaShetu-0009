import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  variant?: "default" | "strong" | "outline";
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({
  children,
  variant = "default",
  glow = false,
  hover = false,
  className,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        variant === "default" && "glass",
        variant === "strong" && "glass-strong",
        variant === "outline" && "border border-border/60 bg-card/40 backdrop-blur-md",
        glow && "shadow-glow",
        hover && "glass-hover cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
