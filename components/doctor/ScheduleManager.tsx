"use client"

import { useState, useTransition } from "react";
import { CalendarDays, Clock, Plus, Trash2, Building2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createScheduleSlot, deleteScheduleSlot } from "@/app/actions/doctor";
import { toast } from "sonner";

type HospitalOption = {
  id: string;
  name: string;
  address?: string | null;
};

type ScheduleSlotItem = {
  id: string;
  doctorId: string;
  hospitalId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  hospital?: HospitalOption | null;
};

interface ScheduleManagerProps {
  hospitals: HospitalOption[];
  initialSlots: ScheduleSlotItem[];
}

export function ScheduleManager({ hospitals, initialSlots }: ScheduleManagerProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hospitalId) {
      toast.error("Select an assigned hospital first.");
      return;
    }

    const formData = new FormData();
    formData.set("hospitalId", hospitalId);
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);

    startTransition(async () => {
      const result = await createScheduleSlot(formData);
      if (result.success && result.slot) {
        setSlots((current) => [...current, result.slot].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
        setStartTime("");
        setEndTime("");
        toast.success("Schedule slot created");
      } else {
        toast.error(result.error || "Failed to create slot");
      }
    });
  };

  const handleDelete = async (slotId: string) => {
    setDeletingId(slotId);
    const result = await deleteScheduleSlot(slotId);
    setDeletingId(null);

    if (result.success) {
      setSlots((current) => current.filter((slot) => slot.id !== slotId));
      toast.success("Slot deleted");
    } else {
      toast.error(result.error || "Failed to delete slot");
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <GlassCard className="lg:col-span-1 h-fit">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Quick Add Slot
        </h3>

        {hospitals.length === 0 ? (
          <div className="glass rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            No assigned hospitals found. Ask an administrator to assign you to a department with a hospital before creating slots.
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Hospital</label>
              <select
                value={hospitalId}
                onChange={(event) => setHospitalId(event.target.value)}
                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                required
              >
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full bg-primary text-primary-foreground shadow-glow">
              {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Slot
            </Button>
          </form>
        )}
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Your Time Slots
        </h3>

        <div className="space-y-3">
          {slots.length > 0 ? (
            slots.map((slot) => (
              <div key={slot.id} className="glass rounded-xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl grid place-items-center",
                    slot.isBooked ? "bg-primary/10" : "bg-emerald-500/10"
                  )}>
                    <Clock className={cn("h-5 w-5", slot.isBooked ? "text-primary" : "text-emerald-500")} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {format(new Date(slot.startTime), "MMM d, h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex flex-wrap items-center gap-2">
                      <span>{slot.isBooked ? "Booked by patient" : "Available for booking"}</span>
                      <span className="opacity-30">|</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {slot.hospital?.name || "Hospital"}
                      </span>
                    </div>
                  </div>
                </div>

                {!slot.isBooked && (
                  <button
                    type="button"
                    disabled={deletingId === slot.id}
                    onClick={() => handleDelete(slot.id)}
                    className="h-8 w-8 rounded-lg glass flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    {deletingId === slot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-40">
              <CalendarDays className="h-12 w-12 mx-auto mb-4" />
              <p className="text-sm">You haven't created any slots yet.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
