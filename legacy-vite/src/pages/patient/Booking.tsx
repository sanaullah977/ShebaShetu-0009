import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS, DOCTORS, TIME_SLOTS } from "@/lib/mock-data";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, CheckCircle2, CalendarPlus, Download,
  Star, MapPin,
} from "lucide-react";

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { dept?: string } };
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dept, setDept] = useState<string>(location.state?.dept ?? "cardiology");
  const [doctor, setDoctor] = useState<string>(DOCTORS.find((d) => d.dept === dept)?.id ?? "d2");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slot, setSlot] = useState<string>("11:40 AM");

  const filteredDoctors = DOCTORS.filter((d) => d.dept === dept);
  const selectedDept = DEPARTMENTS.find((d) => d.id === dept);
  const selectedDoctor = DOCTORS.find((d) => d.id === doctor);

  const Step = ({ n, label }: { n: number; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={cn(
        "h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold border",
        step >= n
          ? "bg-gradient-emerald text-primary-foreground border-transparent shadow-glow"
          : "bg-secondary text-muted-foreground border-border"
      )}>
        {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
      </div>
      <span className={cn("text-xs font-medium", step >= n ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto py-6 animate-scale-in">
        <GlassCard variant="strong" glow className="relative overflow-hidden text-center">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/20 grid place-items-center mb-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">Appointment confirmed</div>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">You're all set, Nadia.</h2>
            <p className="text-sm text-muted-foreground mt-1">Show this token at reception when you arrive.</p>

            <div className="mt-6 glass rounded-2xl p-6 grid sm:grid-cols-[auto,1fr] gap-6 items-center text-left">
              <div className="mx-auto sm:mx-0">
                <div className="h-32 w-32 rounded-2xl bg-foreground p-3 grid place-items-center">
                  {/* QR placeholder */}
                  <div className="grid grid-cols-8 gap-px h-full w-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className={cn("rounded-[1px]", Math.random() > 0.45 ? "bg-background" : "bg-foreground")} />
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-center mt-2 text-muted-foreground">Scan at reception</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your token</div>
                  <div className="text-5xl font-bold text-gradient-emerald leading-none">B-09</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-muted-foreground">Doctor</div>
                    <div className="font-semibold text-sm mt-0.5">{selectedDoctor?.name}</div>
                  </div>
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-muted-foreground">Department</div>
                    <div className="font-semibold text-sm mt-0.5">{selectedDept?.name}</div>
                  </div>
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-muted-foreground">Date</div>
                    <div className="font-semibold text-sm mt-0.5">{date?.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
                  </div>
                  <div className="glass rounded-lg p-2.5">
                    <div className="text-muted-foreground">Time</div>
                    <div className="font-semibold text-sm mt-0.5">{slot}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <Button className="bg-gradient-emerald text-primary-foreground shadow-glow">
                <CalendarPlus className="h-4 w-4 mr-1.5" /> Add to Google Calendar
              </Button>
              <Button variant="outline" className="glass border-border/60">
                <Download className="h-4 w-4 mr-1.5" /> Download token
              </Button>
              <Button variant="ghost" onClick={() => navigate("/patient")}>Go to dashboard</Button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patient · Booking</div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Book a hospital visit</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
        <Step n={1} label="Choose doctor" />
        <div className="h-px w-8 bg-border" />
        <Step n={2} label="Pick time" />
        <div className="h-px w-8 bg-border" />
        <Step n={3} label="Confirm" />
      </div>

      {step === 1 && (
        <div className="grid lg:grid-cols-[260px,1fr] gap-5">
          <GlassCard>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Departments</div>
            <div className="space-y-1.5">
              {DEPARTMENTS.map((d) => {
                const I = d.icon;
                const active = dept === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setDept(d.id); const first = DOCTORS.find((x) => x.dept === d.id); if (first) setDoctor(first.id); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all",
                      active ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <I className={cn("h-4 w-4", active && "text-primary")} />
                    {d.name}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard variant="strong">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Doctors in {selectedDept?.name}</div>
                <div className="text-sm font-semibold">{filteredDoctors.length} available today</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredDoctors.map((d) => {
                const active = doctor === d.id;
                return (
                  <button key={d.id} onClick={() => setDoctor(d.id)} className={cn(
                    "glass glass-hover rounded-xl p-4 text-left transition-all",
                    active && "ring-1 ring-primary/50 shadow-glow"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center text-sm font-semibold">
                        {d.name.split(" ").slice(1, 3).map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.chamber}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {d.rating}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredDoctors.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center col-span-2">No doctors listed for this department yet.</div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} className="bg-gradient-emerald text-primary-foreground shadow-glow">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {step === 2 && (
        <div className="grid lg:grid-cols-2 gap-5">
          <GlassCard variant="strong">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pick a date</div>
            <div className="glass rounded-2xl p-2 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
          </GlassCard>

          <GlassCard variant="strong">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Available slots</div>
                <div className="text-sm font-semibold">{selectedDoctor?.name} · {date?.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
              </div>
              <span className="text-[11px] text-muted-foreground">20-min sessions</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map((t) => {
                const taken = ["10:00 AM", "11:00 AM", "2:40 PM"].includes(t);
                const active = slot === t;
                return (
                  <button
                    key={t}
                    disabled={taken}
                    onClick={() => setSlot(t)}
                    className={cn(
                      "rounded-xl px-2 py-2.5 text-xs font-medium transition-all",
                      taken && "opacity-40 line-through cursor-not-allowed bg-secondary",
                      !taken && !active && "glass glass-hover",
                      active && "bg-gradient-emerald text-primary-foreground shadow-glow"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-5">
              <Button variant="outline" className="glass border-border/60" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-gradient-emerald text-primary-foreground shadow-glow">
                Confirm booking <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
