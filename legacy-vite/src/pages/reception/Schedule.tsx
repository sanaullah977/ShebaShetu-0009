import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { DOCTORS, DEPARTMENTS } from "@/lib/mock-data";
import { SCHEDULE_DAYS, SCHEDULE_SLOTS, DEFAULT_AVAILABILITY } from "@/lib/queue-data";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CalendarRange, Save, RotateCcw, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DoctorSchedule() {
  const [doctorId, setDoctorId] = useState(DOCTORS[0].id);
  const [avail, setAvail] = useState<Record<string, boolean>>(DEFAULT_AVAILABILITY);

  const doctor = DOCTORS.find((d) => d.id === doctorId)!;
  const dept = DEPARTMENTS.find((d) => d.id === doctor.dept)!;
  const DeptIcon = dept.icon;

  const toggle = (k: string) => setAvail((p) => ({ ...p, [k]: !p[k] }));
  const openCount = Object.values(avail).filter(Boolean).length;
  const totalCount = SCHEDULE_DAYS.length * SCHEDULE_SLOTS.length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Schedule manager</div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Doctor availability</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle slots on or off. Patients see only open slots when booking.
        </p>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <GlassCard variant="strong" className="h-fit">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Doctors</div>
          <div className="space-y-1.5">
            {DOCTORS.map((d) => {
              const dDept = DEPARTMENTS.find((x) => x.id === d.dept)!;
              const Icon = dDept.icon;
              const active = d.id === doctorId;
              return (
                <button
                  key={d.id}
                  onClick={() => setDoctorId(d.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                    active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/40"
                  )}
                >
                  <div className={cn("h-9 w-9 grid place-items-center rounded-lg",
                    active ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{dDept.name} · {d.chamber}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard variant="strong">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/15 grid place-items-center">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-base font-semibold">{doctor.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <DeptIcon className="h-3.5 w-3.5" /> {dept.name} · {doctor.chamber}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  <span className="text-foreground font-semibold">{openCount}</span> / {totalCount} slots open
                </div>
                <Button variant="outline" size="sm" onClick={() => { setAvail(DEFAULT_AVAILABILITY); toast.info("Reset to defaults."); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
                <Button size="sm" onClick={() => toast.success("Schedule saved.")} className="bg-gradient-emerald text-primary-foreground">
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <CalendarRange className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Weekly grid · 30-minute slots</h3>
            </div>
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5 mb-1.5">
                <div />
                {SCHEDULE_DAYS.map((d) => (
                  <div key={d} className="text-center text-[11px] uppercase tracking-wider text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="space-y-1.5">
                {SCHEDULE_SLOTS.map((s) => (
                  <div key={s} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5 items-center">
                    <div className="text-[11px] text-muted-foreground tabular-nums">{s}</div>
                    {SCHEDULE_DAYS.map((d) => {
                      const k = `${d}-${s}`;
                      const on = avail[k];
                      return (
                        <button
                          key={k}
                          onClick={() => toggle(k)}
                          className={cn(
                            "h-9 rounded-lg border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
                            on
                              ? "bg-primary/15 border-primary/40 text-primary hover:bg-primary/20"
                              : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40"
                          )}
                        >
                          <Switch checked={on} className="scale-75 pointer-events-none data-[state=checked]:bg-primary" />
                          <span className="hidden xl:inline">{on ? "Open" : "Off"}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
