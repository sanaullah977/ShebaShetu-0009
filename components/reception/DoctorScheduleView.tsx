"use client"

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { CalendarDays, Clock, Search, Filter, User } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/StatusPill";
import { Badge } from "@/components/ui/badge";

interface DoctorScheduleViewProps {
  doctors: any[];
}

export function DoctorScheduleView({ doctors }: DoctorScheduleViewProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(doctors[0]?.id || null);
  const [search, setSearch] = useState("");

  const filteredDoctors = doctors.filter(doc => 
    doc.user.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <GlassCard className="lg:col-span-1 h-[70vh] flex flex-col">
        <div className="mb-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Select Doctor
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input 
              placeholder="Search doctors..."
              className="w-full glass rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all border",
                  selectedDoctorId === doc.id 
                    ? "glass-strong border-primary/50 ring-1 ring-primary/20" 
                    : "glass border-transparent hover:border-border/60"
                )}
              >
                <div className="text-sm font-bold truncate">{doc.user.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{doc.specialization}</div>
              </button>
            ))
          ) : (
            <div className="py-10 text-center opacity-40 text-xs italic">
              No doctors found.
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2 h-[70vh] flex flex-col">
        {selectedDoctor ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Availability for Dr. {selectedDoctor.user.name.split(' ').pop()}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Showing all upcoming time slots</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] px-3">
                <Filter className="h-3 w-3 mr-1.5" /> Filter Date
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {selectedDoctor.schedules.length > 0 ? (
                selectedDoctor.schedules.map((slot: any) => (
                  <div key={slot.id} className={cn(
                    "glass rounded-2xl p-4 flex items-center justify-between transition-all border",
                    slot.isBooked ? "border-primary/10 bg-primary/[0.02]" : "border-emerald-500/10 bg-emerald-500/[0.02]"
                  )}>
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "h-12 w-12 rounded-xl grid place-items-center border",
                        slot.isBooked 
                          ? "bg-primary/10 border-primary/20 text-primary" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      )}>
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">
                          {typeof window !== 'undefined' && format(new Date(slot.startTime), "MMM d, h:mm a")}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-black px-1.5 py-0",
                            slot.isBooked ? "bg-primary/10 text-primary border-primary/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}>
                            {slot.isBooked ? "Booked" : "Available"}
                          </Badge>
                          {slot.appointment?.patient?.user?.name && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Patient: <span className="text-foreground/80 font-bold">{slot.appointment.patient.user.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       {!slot.isBooked && (
                         <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold uppercase border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10">
                           Reserve Slot
                         </Button>
                       )}
                       {slot.isBooked && (
                         <StatusPill status={slot.appointment?.status.toLowerCase() || "confirmed"} />
                       )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
                  <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                  <h4 className="font-bold">No slots scheduled</h4>
                  <p className="text-xs max-w-[200px] text-center mt-1">This doctor has no upcoming schedule slots assigned.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center opacity-40">
            <p className="text-sm italic">Select a doctor to view their schedule.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
