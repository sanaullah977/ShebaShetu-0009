"use client"

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/GlassCard";
import { 
  Users2, Search, ArrowRightLeft, 
  MoreVertical, ChevronUp, ChevronDown, 
  Trash2, Filter, User, BellRing, UserMinus, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { 
  DropdownMenu, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { updateQueueStatus, moveQueuePosition } from "@/app/actions/reception";
import { toast } from "sonner";
import { QueueStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface QueueManagerProps {
  queue: any[];
}

export function QueueManager({ queue }: QueueManagerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const filtered = queue.filter(apt => {
    const s = search.toLowerCase();
    const matchesSearch = 
      apt.patient.user.name?.toLowerCase().includes(s) ||
      apt.patient.user.email?.toLowerCase().includes(s) ||
      apt.queueToken?.tokenNumber.toLowerCase().includes(s) ||
      apt.doctor.user.name?.toLowerCase().includes(s) ||
      apt.doctor.specialization?.toLowerCase().includes(s);
      
    const matchesStatus = statusFilter ? apt.queueToken?.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (tokenId: string, status: QueueStatus) => {
    setActiveAction(`${tokenId}-${status}`);
    startTransition(async () => {
      const res = await updateQueueStatus(tokenId, status);
      if (res.success) toast.success(`Status updated to ${status.replace('_', ' ')}`);
      else toast.error(res.error || "Failed to update status");
      setActiveAction(null);
    });
  };

  const handleMove = async (tokenId: string, direction: "UP" | "DOWN") => {
    setActiveAction(`${tokenId}-${direction}`);
    startTransition(async () => {
      const res = await moveQueuePosition(tokenId, direction);
      if (res.success) toast.success(`Patient moved ${direction.toLowerCase()}`);
      else toast.error(res.error || "Failed to move patient");
      setActiveAction(null);
    });
  };

  const handleCallNext = () => {
    const nextPatient = filtered.find(apt => apt.queueToken?.status === "WAITING");
    if (nextPatient) {
      handleStatusUpdate(nextPatient.queueToken.id, "CALLED");
    } else {
      toast.info("No more patients waiting in the filtered list.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            placeholder="Search by name, token, doctor or specialization..." 
            className="w-full bg-background/50 border border-border/40 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl text-xs h-9 px-4 font-bold bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            onClick={handleCallNext}
            disabled={isPending}
          >
            <BellRing className="h-4 w-4 mr-2" /> Call Next
          </Button>
          <div className="h-6 w-px bg-border/40 mx-1" />
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            size="sm" 
            className="rounded-xl text-xs h-9 px-4 font-semibold transition-all"
            onClick={() => setStatusFilter(null)}
          >
            All Patients
          </Button>
          {["WAITING", "CALLED", "IN_PROGRESS", "COMPLETED", "NO_SHOW"].map((s) => (
            <Button 
              key={s}
              variant={statusFilter === s ? "default" : "outline"} 
              size="sm" 
              className="rounded-xl text-xs h-9 px-4 font-semibold whitespace-nowrap transition-all"
              onClick={() => setStatusFilter(s)}
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length > 0 ? (
          filtered.map((apt) => (
            <GlassCard key={apt.id} className={cn(
              "p-4 flex flex-col sm:flex-row items-center justify-between gap-4 group transition-all duration-300",
              apt.queueToken?.status === "CALLED" ? "border-primary/40 bg-primary/5 shadow-glow-sm" : "hover:border-primary/20"
            )}>
              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className={cn(
                  "h-16 w-16 rounded-2xl border flex flex-col items-center justify-center transition-all duration-500",
                  apt.queueToken?.status === "CALLED" ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 border-primary/20 text-primary group-hover:scale-105"
                )}>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Token</span>
                  <span className="text-xl font-black">{apt.queueToken?.tokenNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold truncate">{apt.patient.user.name}</h3>
                    <StatusPill status={apt.queueToken?.status.toLowerCase()} className="text-[9px] font-black px-2 py-0.5 rounded-full" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground/80">
                    <span className="font-semibold text-foreground/70">Dr. {apt.doctor.user.name}</span>
                    <span className="opacity-30">•</span>
                    <span className="flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      {apt.doctor.specialization}
                    </span>
                    {apt.queueToken?.calledAt && (
                      <>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center gap-1 text-primary/70 font-bold">
                          <BellRing className="h-3 w-3" />
                          Called {format(new Date(apt.queueToken.calledAt), "h:mm a")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-none pt-4 sm:pt-0">
                <div className="flex flex-col items-start sm:items-end">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Queue Position</div>
                  <div className="text-lg font-black text-primary/90">#{apt.queueToken?.position}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 bg-secondary/30 rounded-xl p-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-background/80" 
                      title="Move Up"
                      onClick={() => handleMove(apt.queueToken.id, "UP")}
                      disabled={isPending || apt.queueToken.position === 1 || apt.queueToken.status !== "WAITING"}
                    >
                      {activeAction === `${apt.queueToken.id}-UP` ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-background/80" 
                      title="Move Down"
                      onClick={() => handleMove(apt.queueToken.id, "DOWN")}
                      disabled={isPending || apt.queueToken.status !== "WAITING"}
                    >
                      {activeAction === `${apt.queueToken.id}-DOWN` ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-strong min-w-[200px] p-2 rounded-2xl">
                      <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">General Actions</div>
                      <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium" onClick={() => window.location.href = `/reception/patient/${apt.patient.id}`}>
                        <User className="h-4 w-4" /> View Full Profile
                      </DropdownMenuItem>
                      <div className="my-1 border-t border-border/40" />
                      <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update Queue Status</div>
                      <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-bold text-primary" onClick={() => handleStatusUpdate(apt.queueToken.id, "CALLED")}>
                        <BellRing className="h-4 w-4" /> Call Patient
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleStatusUpdate(apt.queueToken.id, "IN_PROGRESS")}>
                        <div className="h-2 w-2 rounded-full bg-amber-500" /> Start Consultation
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleStatusUpdate(apt.queueToken.id, "WAITING")}>
                        <div className="h-2 w-2 rounded-full bg-gray-500" /> Reset to Waiting
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-orange-500 focus:text-orange-600" onClick={() => handleStatusUpdate(apt.queueToken.id, "NO_SHOW")}>
                        <UserMinus className="h-4 w-4" /> Mark as No-Show
                      </DropdownMenuItem>
                      <div className="my-1 border-t border-border/40" />
                      <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => handleStatusUpdate(apt.queueToken.id, "CANCELLED")}>
                        <Trash2 className="h-4 w-4" /> Cancel Token
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-[2.5rem] border-dashed border-border/60">
            <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
              <Users2 className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-bold">No matching records</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mt-2">
              We couldn't find any patients matching your current search or status filter.
            </p>
            {statusFilter && (
              <Button variant="link" onClick={() => setStatusFilter(null)} className="mt-4 text-primary font-bold">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
