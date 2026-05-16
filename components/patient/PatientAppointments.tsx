"use client"

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { format } from "date-fns";
import { CalendarDays, Clock, Search, ChevronRight, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

interface PatientAppointmentsProps {
  initialAppointments: any[];
}

export function PatientAppointments({ initialAppointments }: PatientAppointmentsProps) {
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  const filtered = useMemo(() => initialAppointments.filter((apt) => {
    const scheduledAt = new Date(apt.scheduledAt);
    const scheduledDate = [
      format(scheduledAt, "d MMM yyyy h:mm a"),
      format(scheduledAt, "yyyy-MM-dd"),
      format(scheduledAt, "PPPP"),
    ].join(" ").toLowerCase();
    const haystack = [
      apt.id,
      apt.doctor?.user?.name,
      apt.doctor?.specialization,
      apt.department?.name,
      apt.hospital?.name,
      apt.status,
      scheduledDate,
      apt.symptoms,
      apt.clinicalNotes,
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase().trim());
    
    if (!matchesSearch) return false;
    
    if (filter === "UPCOMING") {
      return ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(apt.status);
    }
    if (filter === "COMPLETED") return apt.status === "COMPLETED";
    if (filter === "CANCELLED") return apt.status === "CANCELLED";
    
    return true;
  }), [initialAppointments, search, filter]);

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
            placeholder="Search doctor, date, status, reason..."
            className="w-full glass rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              aria-label="Clear appointment search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full glass hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => setSelectedAppointment(apt)}
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

      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="glass-strong border-border/60">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Review your selected appointment information.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-3 text-sm">
              <Detail label="Doctor" value={selectedAppointment.doctor?.user?.name || "Not assigned"} />
              <Detail label="Specialization" value={selectedAppointment.doctor?.specialization || selectedAppointment.department?.name || "General"} />
              <Detail label="Department" value={selectedAppointment.department?.name || "Not provided"} />
              <Detail label="Date" value={format(new Date(selectedAppointment.scheduledAt), "PPP")} />
              <Detail label="Time" value={format(new Date(selectedAppointment.scheduledAt), "p")} />
              <Detail label="Status" value={selectedAppointment.status || "PENDING"} />
              <Detail label="Queue Token" value={selectedAppointment.queueToken?.tokenNumber || "Not checked in"} />
              <div className="rounded-xl bg-background/40 border border-border/40 p-3">
                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Reason / Notes</div>
                <div className="mt-1 text-sm">{selectedAppointment.symptoms || "No reason provided."}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background/40 border border-border/40 p-3">
      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}
