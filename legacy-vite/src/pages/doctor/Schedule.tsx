import { GlassCard } from "@/components/GlassCard";
import { SCHEDULE_DAYS, SCHEDULE_SLOTS, DEFAULT_AVAILABILITY, QUEUE_ENTRIES } from "@/lib/queue-data";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DoctorScheduleView() {
  // Booked slots are inferred from today's queue entries belonging to this doctor.
  const doctorName = "Dr. Anika Rahman";
  const bookedSlots = new Set(
    QUEUE_ENTRIES.filter((q) => q.doctor === doctorName).map((q, i) => `Tue-${SCHEDULE_SLOTS[i % SCHEDULE_SLOTS.length]}`)
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">My schedule</div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">This week</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {doctorName} · Medicine · Room 204
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Kpi icon={CalendarDays} label="Open slots" value={Object.values(DEFAULT_AVAILABILITY).filter(Boolean).length} />
        <Kpi icon={Clock} label="Booked today" value={bookedSlots.size} />
        <Kpi icon={CalendarDays} label="Days off" value={1} />
      </div>

      <GlassCard variant="strong" className="overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Weekly view</h3>
          <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            <Legend color="bg-primary/30 ring-primary/50" label="Booked" />
            <Legend color="bg-primary/10 ring-primary/30" label="Open" />
            <Legend color="bg-muted/30 ring-border/40" label="Off" />
          </div>
        </div>

        <div className="min-w-[720px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5 mb-1.5">
            <div />
            {SCHEDULE_DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] uppercase tracking-wider text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {SCHEDULE_SLOTS.map((s) => (
              <div key={s} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5 items-center">
                <div className="text-[11px] text-muted-foreground tabular-nums">{s}</div>
                {SCHEDULE_DAYS.map((d) => {
                  const k = `${d}-${s}`;
                  const on = DEFAULT_AVAILABILITY[k];
                  const booked = bookedSlots.has(k);
                  return (
                    <div
                      key={k}
                      className={cn(
                        "h-9 rounded-lg ring-1 text-[11px] font-medium flex items-center justify-center",
                        booked ? "bg-primary/30 ring-primary/50 text-primary-foreground/90"
                          : on ? "bg-primary/10 ring-primary/30 text-primary"
                          : "bg-muted/20 ring-border/40 text-muted-foreground"
                      )}
                    >
                      {booked ? "Booked" : on ? "Open" : "Off"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: number }) {
  return (
    <GlassCard className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </GlassCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-3 w-3 rounded-sm ring-1", color)} />
      {label}
    </span>
  );
}
