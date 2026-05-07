import { GlassCard } from "@/components/GlassCard";
import { QUEUE_ENTRIES } from "@/lib/queue-data";
import { Users2, Activity, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusPill } from "@/components/StatusPill";

export default function ReceptionDashboard() {
  const waiting = QUEUE_ENTRIES.filter((q) => q.status === "waiting").length;
  const called = QUEUE_ENTRIES.filter((q) => q.status === "called").length;
  const completed = QUEUE_ENTRIES.filter((q) => q.status === "completed").length;
  const total = QUEUE_ENTRIES.length;
  const avgWait = "11m";

  const stats = [
    { label: "Today's patients", value: total, icon: Users2, accent: "text-primary", bg: "bg-primary/15" },
    { label: "Currently waiting", value: waiting, icon: Clock, accent: "text-warning", bg: "bg-warning/15" },
    { label: "In consultation", value: called, icon: Activity, accent: "text-primary", bg: "bg-primary/15" },
    { label: "Completed", value: completed, icon: CheckCircle2, accent: "text-success", bg: "bg-success/15" },
  ];

  const live = QUEUE_ENTRIES.filter((q) => q.status === "called" || q.status === "waiting").slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Reception desk</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Today at a glance</h1>
          <p className="text-sm text-muted-foreground mt-1">Live snapshot of the OPD floor — Tuesday, 19 Apr 2026.</p>
        </div>
        <Link to="/reception/queue" className="inline-flex items-center gap-2 rounded-xl bg-gradient-emerald text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow">
          Open queue manager <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <GlassCard key={s.label} className="relative overflow-hidden">
              <div className={`h-10 w-10 rounded-xl ${s.bg} grid place-items-center mb-3`}>
                <Icon className={`h-5 w-5 ${s.accent}`} />
              </div>
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard variant="strong" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Live floor</h2>
              <p className="text-xs text-muted-foreground">Top of the queue right now</p>
            </div>
            <Link to="/reception/queue" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border/50">
            {live.map((q) => (
              <div key={q.id} className="flex items-center gap-3 py-3">
                <div className="h-10 w-12 grid place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/30 text-primary text-xs font-bold">
                  {q.token}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{q.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{q.dept} · {q.doctor}</div>
                </div>
                <StatusPill status={q.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Throughput</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Avg wait time</span>
                <span className="font-semibold">{avgWait}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full bg-gradient-emerald rounded-full" style={{ width: "62%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-semibold">{Math.round((completed / total) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full bg-gradient-emerald rounded-full" style={{ width: `${(completed / total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Floor capacity</span>
                <span className="font-semibold">{Math.round((waiting / 20) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${(waiting / 20) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-primary/5 ring-1 ring-primary/20 p-3 text-[11px] text-muted-foreground">
            <span className="text-foreground font-medium">Tip:</span> Use “Call Next” in the queue manager to advance the floor smoothly.
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
