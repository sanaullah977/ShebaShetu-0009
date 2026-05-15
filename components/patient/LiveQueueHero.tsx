"use client"

import { useQueueStatus } from "@/hooks/use-queue";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface LiveQueueHeroProps {
  appointmentId: string;
  tokenNumber?: string;
  departmentName?: string;
  doctorName?: string;
  roomNumber?: string;
  initialAheadCount?: number;
}

export function LiveQueueHero({
  appointmentId,
  tokenNumber: initialToken = "N/A",
  departmentName: initialDept = "General",
  doctorName: initialDoc = "Assigning...",
  roomNumber = "Room not assigned",
  initialAheadCount = 0
}: LiveQueueHeroProps) {
  const router = useRouter();
  const { data, isLoading } = useQueueStatus(appointmentId);

  // Fallback to server-provided initial data while loading or if error
  const token = data?.tokenNumber ?? initialToken;
  const dept = data?.departmentName ?? initialDept;
  const doc = data?.doctorName ?? initialDoc;
  const room = data?.roomNumber || roomNumber || "Room not assigned";
  const aheadCount = data?.aheadCount ?? initialAheadCount;
  const eta = data?.estimatedWait ?? (initialAheadCount * 12);
  
  // Visual progress calculation (simple heuristic)
  const progress = Math.max(10, 100 - (aheadCount * 10));

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
            <div className="text-3xl font-bold text-gradient-emerald mt-0.5">{token}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{dept}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusPill status="live" />
            {isLoading ? (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating...
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Live connection active</span>
            )}
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold">
              You are <span className="text-gradient-emerald">#{aheadCount}</span> in queue
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Estimated wait <span className="text-foreground font-semibold">~{Math.round(eta)} min</span> · {doc} · {room === "Room not assigned" ? room : `Room ${room}`}
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
