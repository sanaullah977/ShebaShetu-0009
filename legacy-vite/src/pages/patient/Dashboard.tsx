import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { AIDisclaimer } from "@/components/AIDisclaimer";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS, QUEUE_AHEAD } from "@/lib/mock-data";
import {
  Sparkles, ArrowRight, Clock, MapPin, CalendarDays, ChevronRight,
  TrendingUp, Activity, Stethoscope,
} from "lucide-react";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [aheadCount, setAheadCount] = useState(3);
  const [progress, setProgress] = useState(62);
  const [eta, setEta] = useState(18);
  const [symptom, setSymptom] = useState("");

  // simulated live updates
  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 96 ? 60 : p + 1));
      setEta((e) => (e <= 6 ? 22 : e - 1));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setAheadCount((c) => (c <= 1 ? 4 : c - 1));
    }, 9000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patient · Dashboard</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Assalamu Alaikum, Nadia 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your visit is moving quickly. Here's the calm view.
          </p>
        </div>
        <Button onClick={() => navigate("/patient/book")} className="bg-gradient-emerald text-primary-foreground shadow-glow">
          <CalendarDays className="h-4 w-4 mr-1.5" /> Book new visit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hero Live Queue */}
        <GlassCard variant="strong" className="lg:col-span-2 relative overflow-hidden p-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/15 blur-[100px]" />
          <div className="relative p-6 sm:p-8 grid sm:grid-cols-[auto,1fr] gap-6 items-center">
            {/* circular */}
            <div className="relative h-40 w-40 mx-auto">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#g1)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 326.7} 326.7`}
                  className="transition-all duration-700 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                />
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your token</div>
                <div className="text-3xl font-bold text-gradient-emerald mt-0.5">A-24</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Medicine</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusPill status="live" />
                <span className="text-[11px] text-muted-foreground">Updated just now</span>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold">
                  You are <span className="text-gradient-emerald">#{aheadCount}</span> in queue
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Estimated wait <span className="text-foreground font-semibold">~{eta} min</span> · Dr. Anika Rahman · Room 204
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={() => navigate("/patient/queue")} className="bg-gradient-emerald text-primary-foreground shadow-glow">
                  <Activity className="h-4 w-4 mr-1.5" /> Open live queue
                </Button>
                <Button variant="outline" className="glass border-border/60">
                  <MapPin className="h-4 w-4 mr-1.5" /> Directions
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Upcoming */}
        <GlassCard className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Upcoming</div>
            <button onClick={() => navigate("/patient/appointments")} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="glass rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <StatusPill status="upcoming" />
                <span className="text-[10px] text-muted-foreground">Mon, 22 Apr</span>
              </div>
              <div className="text-sm font-semibold">Dr. Tanvir Hossain</div>
              <div className="text-xs text-muted-foreground">Cardiology · Room 312</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> 4:15 PM · Token B-08
              </div>
            </div>
            <div className="glass rounded-xl p-3.5 opacity-80">
              <div className="flex items-center justify-between mb-2">
                <StatusPill status="upcoming" />
                <span className="text-[10px] text-muted-foreground">Sun, 28 Apr</span>
              </div>
              <div className="text-sm font-semibold">Dr. Rezwana Karim</div>
              <div className="text-xs text-muted-foreground">Pediatrics · Room 105</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> 10:00 AM · Token C-04
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Symptom quick entry */}
        <GlassCard variant="strong" className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-[80px]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Quick symptom check</div>
                <div className="text-sm font-semibold">What's bothering you today?</div>
              </div>
            </div>

            <Textarea
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="e.g. Sharp chest pain since morning, mild fever, dizziness when standing…"
              className="min-h-[110px] glass border-border/60 text-sm"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {["Chest pain", "Fever 3 days", "Joint pain", "Cough & cold", "Stomach ache"].map((q) => (
                <button
                  key={q}
                  onClick={() => setSymptom(q)}
                  className="glass glass-hover rounded-full px-3 py-1 text-[11px]"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
              <p className="text-[11px] text-muted-foreground max-w-md">
                ShebaSetu AI will suggest a department in seconds. You can always pick manually.
              </p>
              <Button
                onClick={() => navigate("/patient/symptom", { state: { symptom } })}
                className="bg-gradient-emerald text-primary-foreground shadow-glow"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Get AI department suggestion
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Quick stats */}
        <GlassCard>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Your care</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: TrendingUp, val: "12", label: "Visits done" },
              { icon: Stethoscope, val: "4", label: "Doctors seen" },
              { icon: CalendarDays, val: "2", label: "Upcoming" },
              { icon: Activity, val: "98%", label: "On-time rate" },
            ].map(({ icon: I, val, label }) => (
              <div key={label} className="glass rounded-xl p-3">
                <I className="h-4 w-4 text-primary mb-1.5" />
                <div className="text-xl font-bold">{val}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="text-[11px] text-muted-foreground mb-2">Browse departments</div>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.slice(0, 6).map((d) => {
                const I = d.icon;
                return (
                  <button key={d.id} onClick={() => navigate("/patient/book")} className="glass glass-hover rounded-full px-2.5 py-1 text-[11px] flex items-center gap-1">
                    <I className="h-3 w-3 text-primary" /> {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* People ahead — discreet preview */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">People ahead of you</div>
            <div className="text-xs text-muted-foreground">Identities are anonymized for privacy.</div>
          </div>
          <button onClick={() => navigate("/patient/queue")} className="text-xs text-primary hover:underline flex items-center gap-1">
            See full queue <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {QUEUE_AHEAD.map((p) => (
            <div key={p.token} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-[11px] font-semibold">
                {p.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">Token {p.token}</div>
                <div className="text-[11px] text-muted-foreground truncate">{p.reason} · waited {p.waited}</div>
              </div>
              <StatusPill status="waiting" />
            </div>
          ))}
        </div>
      </GlassCard>

      <AIDisclaimer />
    </div>
  );
}
