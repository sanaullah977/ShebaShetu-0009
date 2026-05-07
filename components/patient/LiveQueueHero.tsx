"use client"

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Activity, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface LiveQueueHeroProps {
  tokenNumber?: string;
  departmentName?: string;
  doctorName?: string;
  roomNumber?: string;
  initialAheadCount?: number;
}

export function LiveQueueHero({
  tokenNumber = "N/A",
  departmentName = "General",
  doctorName = "Assigning...",
  roomNumber = "TBD",
  initialAheadCount = 0
}: LiveQueueHeroProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(62);
  const [eta, setEta] = useState(18);
  const [aheadCount, setAheadCount] = useState(initialAheadCount);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 96 ? 60 : p + 0.1));
      setEta((e) => (e <= 5 ? 20 : e - 0.05));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <GlassCard variant="strong" className="lg:col-span-2 relative overflow-hidden p-0">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/15 blur-[100px]" />
      <div className="relative p-6 sm:p-8 grid sm:grid-cols-[auto,1fr] gap-6 items-center">
        <div className="relative h-40 w-40 mx-auto">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#g1)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 326.7} 326.7`}
              className="transition-all duration-700 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
            />
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your token</div>
            <div className="text-3xl font-bold text-gradient-emerald mt-0.5">{tokenNumber}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{departmentName}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusPill status="live" />
            <span className="text-[11px] text-muted-foreground">Live connection active</span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold">
              You are <span className="text-gradient-emerald">#{aheadCount}</span> in queue
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Estimated wait <span className="text-foreground font-semibold">~{Math.round(eta)} min</span> · {doctorName} · Room {roomNumber}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => router.push("/patient/live-queue")} className="bg-gradient-emerald text-primary-foreground shadow-glow">
              <Activity className="h-4 w-4 mr-1.5" /> Open live tracker
            </Button>
            <Button variant="outline" className="glass border-border/60">
              <MapPin className="h-4 w-4 mr-1.5" /> Room directions
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
