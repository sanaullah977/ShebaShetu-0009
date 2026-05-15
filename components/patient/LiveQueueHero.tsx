"use client"

import { useQueueStatus } from "@/hooks/use-queue";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Loader2, BellRing, UserMinus, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const status = data?.status || "WAITING";
  const eta = data?.estimatedWait ?? (initialAheadCount * 12);
  
  // Visual progress calculation
  const progress = status === "CALLED" || status === "IN_PROGRESS" ? 100 : Math.max(10, 100 - (aheadCount * 10));

  const isCalled = status === "CALLED";
  const isNoShow = status === "NO_SHOW";

  return (
    <GlassCard variant="strong" className={cn(
      "lg:col-span-2 relative overflow-hidden p-0 transition-all duration-500",
      isCalled ? "border-primary/60 bg-primary/10 shadow-glow ring-2 ring-primary/20" : 
      isNoShow ? "border-orange-500/40 bg-orange-500/5" : ""
    )}>
      <div className={cn(
        "absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px] transition-colors duration-1000",
        isCalled ? "bg-primary/30" : isNoShow ? "bg-orange-500/20" : "bg-primary/15"
      )} />
      
      <div className="relative p-6 sm:p-8 grid sm:grid-cols-[auto,1fr] gap-8 items-center">
        <div className="relative h-44 w-44 mx-auto group">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="hsl(var(--border))" strokeWidth="8" fill="none" className="opacity-20" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={isCalled ? "hsl(var(--primary))" : isNoShow ? "orange" : "url(#g1)"} 
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 326.7} 326.7`}
              className="transition-all duration-1000 drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
            />
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Your Token</div>
            <div className={cn(
              "text-4xl font-black mt-1 transition-all",
              isCalled ? "scale-110 text-primary" : "text-gradient-emerald"
            )}>{token}</div>
            <div className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mt-1 bg-secondary/50 px-2 py-0.5 rounded-full">{dept}</div>
          </div>
          
          {isCalled && (
            <div className="absolute -top-2 -right-2 h-10 w-10 bg-primary rounded-full flex items-center justify-center animate-bounce shadow-glow">
               <BellRing className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <StatusPill status={status.toLowerCase() as any} className="font-black px-3 py-1" />
            {isLoading ? (
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synchronizing...
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
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

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => router.push("/patient/live-queue")} className="bg-primary text-primary-foreground h-12 px-6 rounded-2xl font-bold shadow-glow transition-all active:scale-95">
              <Activity className="h-5 w-5 mr-2" /> 
              {isCalled ? "View Navigation" : "Full Tracker"}
            </Button>
            <Button 
              variant="outline" 
              className="glass border-border/60 h-12 px-6 rounded-2xl font-bold transition-all active:scale-95"
              onClick={() => {
                router.refresh();
              }}
            >
              <Loader2 className={cn("h-5 w-5 mr-2", isLoading && "animate-spin")} /> 
              Sync Now
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
