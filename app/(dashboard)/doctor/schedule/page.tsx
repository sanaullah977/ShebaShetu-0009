import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { CalendarDays, Clock, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { createScheduleSlot, toggleSlotAvailability } from "@/app/actions/doctor";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DoctorSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      schedules: {
        orderBy: { startTime: "asc" }
      }
    }
  });

  if (!doctor) return <div>Doctor profile not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Slot Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set your availability and manage patient booking slots.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Quick Add Slot
          </h3>
          <form action={createScheduleSlot} className="space-y-4">
            <input type="hidden" name="hospitalId" value="6a04e089776596bf042269fc" /> {/* Placeholder Hospital */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Start Time</label>
              <input 
                type="datetime-local" 
                name="startTime" 
                className="w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">End Time</label>
              <input 
                type="datetime-local" 
                name="endTime" 
                className="w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground shadow-glow">
              Generate Slot
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Your Time Slots
          </h3>
          
          <div className="space-y-3">
            {doctor.schedules.length > 0 ? (
              doctor.schedules.map((slot) => (
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
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {slot.isBooked ? "Booked by Patient" : "Available for Booking"}
                      </div>
                    </div>
                  </div>
                  
                  {!slot.isBooked && (
                    <div className="flex items-center gap-2">
                      <form action={async () => {
                        "use server"
                        const { deleteScheduleSlot } = await import("@/app/actions/doctor");
                        await deleteScheduleSlot(slot.id);
                      }}>
                        <button type="submit" className="h-8 w-8 rounded-lg glass flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
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
    </div>
  );
}
