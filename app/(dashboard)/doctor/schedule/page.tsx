import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { CalendarDays, Clock, Plus, Trash2, AlertCircle, Info } from "lucide-react";
import { prisma } from "@/lib/db";
import { createScheduleSlot } from "@/app/actions/doctor";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function DoctorSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      departments: {
        select: { hospitalId: true }
      },
      schedules: {
        orderBy: { startTime: "asc" }
      }
    }
  });

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Doctor Profile Not Found</h2>
        <p className="text-muted-foreground mt-2">Please contact administration to set up your profile.</p>
      </div>
    );
  }

  const hospitalId = doctor.departments[0]?.hospitalId;
  const hasRoom = !!doctor.roomNumber && doctor.roomNumber.trim() !== "";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-black tracking-widest text-primary/80 mb-1">Time Management</div>
          <h1 className="text-3xl font-black tracking-tight">Slot Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set your availability and manage patient booking slots.
          </p>
        </div>
      </div>

      {!hasRoom && (
        <div className="glass-strong border-orange-500/20 bg-orange-500/5 p-4 rounded-2xl flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-orange-600">Room Number Required</div>
            <p className="text-xs text-orange-600/80 mt-1">
              You must set your room number in settings before you can create new slots. 
              This ensures patients know where to find you.
            </p>
            <Link href="/doctor/settings">
              <Button size="sm" variant="outline" className="mt-3 h-8 text-[10px] font-bold uppercase border-orange-500/30 hover:bg-orange-500/10">
                Go to Settings
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!hospitalId && (
        <div className="glass-strong border-destructive/20 bg-destructive/5 p-4 rounded-2xl flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <div className="text-sm font-bold text-destructive">No Hospital Assigned</div>
            <p className="text-xs text-destructive/80 mt-1">
              You are not assigned to any department/hospital. Please contact administration.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className={cn("lg:col-span-1", (!hasRoom || !hospitalId) && "opacity-60 grayscale pointer-events-none")}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Quick Add Slot
          </h3>
          <form action={async (formData) => { "use server"; await createScheduleSlot(formData); }} className="space-y-4">
            <input type="hidden" name="hospitalId" value={hospitalId || ""} />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Start Time</label>
              <input 
                type="datetime-local" 
                name="startTime" 
                className="w-full bg-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">End Time</label>
              <input 
                type="datetime-local" 
                name="endTime" 
                className="w-full bg-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                required
              />
            </div>
            <Button type="submit" disabled={!hasRoom || !hospitalId} className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-bold shadow-glow transition-all active:scale-95">
              Generate Slot
            </Button>
          </form>
          
          <div className="mt-6 p-4 glass rounded-xl bg-primary/5">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary mb-2">
                <Info className="h-3.5 w-3.5" /> Pro Tip
             </div>
             <p className="text-[10px] text-muted-foreground leading-relaxed">
               Create slots in 30-minute intervals for optimal queue management and reduced patient wait times.
             </p>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Your Schedule Overview
          </h3>
          
          <div className="space-y-3">
            {doctor.schedules.length > 0 ? (
              doctor.schedules.map((slot) => (
                <div key={slot.id} className="glass border-border/20 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl grid place-items-center transition-all duration-500",
                      slot.isBooked ? "bg-primary/10" : "bg-emerald-500/10"
                    )}>
                      <Clock className={cn("h-6 w-6", slot.isBooked ? "text-primary" : "text-emerald-500")} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">
                        {format(new Date(slot.startTime), "MMM d, h:mm a")} — {format(new Date(slot.endTime), "h:mm a")}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                           "h-1.5 w-1.5 rounded-full animate-pulse",
                           slot.isBooked ? "bg-primary" : "bg-emerald-500"
                        )} />
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          {slot.isBooked ? "Booked by Patient" : "Open for Booking"}
                        </span>
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
                        <button type="submit" className="h-10 w-10 rounded-xl glass border-border/40 flex items-center justify-center text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all duration-300 active:scale-90">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-24 text-center opacity-40">
                <CalendarDays className="h-16 w-16 mx-auto mb-4" />
                <div className="text-sm font-bold">Your schedule is empty</div>
                <p className="text-xs mt-1">Create slots to start accepting appointments.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
