"use client"

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { format } from "date-fns";
import { 
  CalendarDays, Clock, Search, Filter, 
  ChevronRight, XCircle, MoreVertical,
  Trash2, Info, Loader2, Stethoscope,
  ClipboardList, Pill
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cancelAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface PatientAppointmentsProps {
  initialAppointments: any[];
}

export function PatientAppointments({ initialAppointments }: PatientAppointmentsProps) {
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filtered = initialAppointments.filter((apt) => {
    const matchesSearch = apt.doctor.user.name.toLowerCase().includes(search.toLowerCase()) || 
                          apt.department.name.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === "UPCOMING") {
      return ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(apt.status);
    }
    if (filter === "COMPLETED") return apt.status === "COMPLETED";
    if (filter === "CANCELLED") return apt.status === "CANCELLED";
    
    return true;
  });

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    
    startTransition(async () => {
      const result = await cancelAppointment(id);
      if (result.success) {
        toast.success("Appointment cancelled.");
      } else {
        toast.error(result.error || "Failed to cancel.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 glass rounded-2xl w-fit">
          {(["ALL", "UPCOMING", "COMPLETED", "CANCELLED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all",
                filter === t ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            placeholder="Search by doctor or dept..."
            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((apt) => (
            <GlassCard key={apt.id} className="group hover:ring-1 hover:ring-primary/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl grid place-items-center transition-colors",
                    apt.status === "COMPLETED" ? "bg-emerald-500/10" : "bg-primary/10"
                  )}>
                    <CalendarDays className={cn(
                      "h-7 w-7",
                      apt.status === "COMPLETED" ? "text-emerald-500" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <div className="text-lg font-bold group-hover:text-primary transition-colors">{apt.doctor.user.name}</div>
                    <div className="text-sm text-muted-foreground font-medium">{apt.department.name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 flex-1">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Date</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-primary/60" /> {format(new Date(apt.scheduledAt), 'd MMM, yyyy')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Time</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary/60" /> {format(new Date(apt.scheduledAt), 'h:mm a')}
                    </div>
                  </div>
                  <div className="space-y-1 hidden sm:block">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Status</div>
                    <StatusPill status={apt.status.toLowerCase() as any} />
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="sm:hidden flex-1">
                    <StatusPill status={apt.status.toLowerCase() as any} />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full glass hover:bg-primary/10 hover:text-primary transition-all">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-strong border-border/40">
                      <DropdownMenuItem onClick={() => { setSelectedApt(apt); setIsDetailsOpen(true); }} className="flex items-center gap-2 cursor-pointer">
                        <Info className="h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      {["PENDING", "CONFIRMED"].includes(apt.status) && (
                        <DropdownMenuItem onClick={() => handleCancel(apt.id)} className="flex items-center gap-2 text-destructive cursor-pointer focus:text-destructive">
                          <Trash2 className="h-4 w-4" /> Cancel Appointment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    onClick={() => { setSelectedApt(apt); setIsDetailsOpen(true); }}
                    variant="ghost" size="icon" className="rounded-full glass hover:bg-primary/10 hover:text-primary transition-all hidden sm:flex"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-3xl border-dashed border-2 border-border/60 opacity-60">
            <XCircle className="h-12 w-12 mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-bold uppercase tracking-tight">No results found</h3>
            <p className="text-sm max-w-xs mt-1">
              {search ? "Try adjusting your search terms or filters." : "You haven't booked any medical visits yet."}
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="glass-strong border-border/40 max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <StatusPill status={selectedApt?.status.toLowerCase() as any} />
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                Ref: {selectedApt?.id.slice(-8).toUpperCase()}
              </div>
            </div>
            <DialogTitle className="text-2xl font-black">{selectedApt?.doctor.user.name}</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedApt?.department.name} · {selectedApt && format(new Date(selectedApt.scheduledAt), 'PPP p')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                <Stethoscope className="h-4 w-4" /> Patient Symptoms
              </div>
              <div className="glass p-4 rounded-xl text-sm leading-relaxed min-h-[60px]">
                {selectedApt?.symptoms || "No symptoms recorded during booking."}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  <ClipboardList className="h-4 w-4" /> Clinical Notes
                </div>
                <div className="glass p-4 rounded-xl text-xs leading-relaxed min-h-[80px] border-emerald-500/10">
                  {selectedApt?.clinicalNotes || "Notes will appear here after the consultation."}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                  <Pill className="h-4 w-4" /> Prescription
                </div>
                <div className="glass p-4 rounded-xl text-xs leading-relaxed min-h-[80px] border-blue-500/10">
                  {selectedApt?.prescription || "Prescription will appear here once issued."}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between items-center gap-4">
            <div className="text-[10px] text-muted-foreground italic">
              * This is a secure clinical record.
            </div>
            <Button onClick={() => setIsDetailsOpen(false)} className="glass-strong rounded-xl px-8">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

