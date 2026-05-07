import { useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { QUEUE_ENTRIES, type QueueEntry, type QueueStatus } from "@/lib/queue-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PhoneCall, CheckCircle2, Clock, UserX, TimerReset, ArrowRightCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Tab = "waiting" | "called" | "completed";

export default function QueueManager() {
  const [entries, setEntries] = useState<QueueEntry[]>(QUEUE_ENTRIES);
  const [tab, setTab] = useState<Tab>("waiting");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    waiting: entries.filter((e) => e.status === "waiting" || e.status === "delayed" || e.status === "absent").length,
    called: entries.filter((e) => e.status === "called").length,
    completed: entries.filter((e) => e.status === "completed").length,
  }), [entries]);

  const filtered = useMemo(() => {
    const inTab = entries.filter((e) =>
      tab === "waiting" ? (e.status === "waiting" || e.status === "delayed" || e.status === "absent")
      : tab === "called" ? e.status === "called"
      : e.status === "completed"
    );
    if (!query.trim()) return inTab;
    const q = query.toLowerCase();
    return inTab.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.token.toLowerCase().includes(q) ||
      e.doctor.toLowerCase().includes(q) ||
      e.dept.toLowerCase().includes(q)
    );
  }, [entries, tab, query]);

  const update = (id: string, status: QueueStatus, msg: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    toast.success(msg);
  };

  const callNext = () => {
    const next = entries.find((e) => e.status === "waiting");
    if (!next) return toast.info("No patients waiting.");
    update(next.id, "called", `${next.token} · ${next.name} called to ${next.doctor}.`);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Queue manager</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Floor control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Call patients, mark completion, and keep the OPD moving.
          </p>
        </div>
        <Button onClick={callNext} className="bg-gradient-emerald text-primary-foreground shadow-glow h-11 px-5">
          <PhoneCall className="h-4 w-4" /> Call next patient
        </Button>
      </header>

      <GlassCard variant="strong" className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="bg-muted/40 backdrop-blur-md">
              <TabsTrigger value="waiting" className="gap-2">
                <Clock className="h-3.5 w-3.5" /> Waiting
                <span className="ml-1 rounded-full bg-warning/20 text-warning px-1.5 text-[10px] font-semibold">{counts.waiting}</span>
              </TabsTrigger>
              <TabsTrigger value="called" className="gap-2">
                <ArrowRightCircle className="h-3.5 w-3.5" /> Called
                <span className="ml-1 rounded-full bg-primary/20 text-primary px-1.5 text-[10px] font-semibold">{counts.called}</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                <span className="ml-1 rounded-full bg-muted/50 text-muted-foreground px-1.5 text-[10px] font-semibold">{counts.completed}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={tab} />
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search token, name, doctor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-input/40 border-border/60"
            />
          </div>
        </div>
      </GlassCard>

      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <GlassCard className="text-center py-10 text-sm text-muted-foreground">
            No patients in this list.
          </GlassCard>
        )}

        {filtered.map((e) => (
          <GlassCard key={e.id} className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-3 lg:w-[28%] min-w-0">
                <div className="h-12 w-14 shrink-0 grid place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                  <span className="text-primary font-bold text-sm">{e.token}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{e.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{e.phone} · arrived {e.arrived}</div>
                </div>
              </div>

              <div className="lg:w-[34%] min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Visit reason</div>
                <div className="text-sm truncate">{e.reason}</div>
              </div>

              <div className="lg:w-[22%] min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Assigned</div>
                <div className="text-sm truncate">{e.doctor}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{e.dept}</span>
                  {e.aiDept && e.aiDept !== e.dept && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] px-1.5 py-0.5">
                      <Sparkles className="h-2.5 w-2.5" /> AI: {e.aiDept}
                    </span>
                  )}
                </div>
              </div>

              <div className="lg:ml-auto flex items-center gap-2 flex-wrap">
                <StatusPill status={e.status} />
                {e.status === "waiting" && (
                  <>
                    <Button size="sm" onClick={() => update(e.id, "called", `${e.token} called.`)} className="bg-gradient-emerald text-primary-foreground">
                      <PhoneCall className="h-3.5 w-3.5" /> Call
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => update(e.id, "delayed", `${e.token} delayed.`)} className="border-warning/40 text-warning hover:bg-warning/10">
                      <TimerReset className="h-3.5 w-3.5" /> Delay
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => update(e.id, "absent", `${e.token} marked absent.`)} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                      <UserX className="h-3.5 w-3.5" /> Absent
                    </Button>
                  </>
                )}
                {e.status === "called" && (
                  <Button size="sm" onClick={() => update(e.id, "completed", `${e.token} completed.`)} className="bg-gradient-emerald text-primary-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark completed
                  </Button>
                )}
                {(e.status === "delayed" || e.status === "absent") && (
                  <Button size="sm" variant="outline" onClick={() => update(e.id, "waiting", `${e.token} restored to waiting.`)}>
                    Restore
                  </Button>
                )}
                {e.status === "completed" && (
                  <span className="text-[11px] text-muted-foreground">Visit closed</span>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
