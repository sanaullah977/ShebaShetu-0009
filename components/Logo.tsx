import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-9 w-9 rounded-xl bg-gradient-emerald grid place-items-center shadow-glow">
        <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/40" />
      </div>
      {showText && (
        <div className="leading-tight">
          <div className="font-bold text-[15px] tracking-tight text-foreground">ShebaSetu</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Care · Connect</div>
        </div>
      )}
    </Link>
  );
}
