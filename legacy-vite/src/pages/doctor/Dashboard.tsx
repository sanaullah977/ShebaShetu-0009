import { useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { QUEUE_ENTRIES, type QueueEntry } from "@/lib/queue-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, ImageIcon, Play, CheckCircle2, ClipboardList, Activity, Users2, Phone } from "lucide-react";
import { AIDisclaimer } from "@/components/AIDisclaimer";
import { toast } from "sonner";

export default function DoctorDashboard() {
  // Doctor view: assume "Dr. Anika Rahman" — show her patients (Medicine)
  const doctorName = "Dr. Anika Rahman";
  const [entries, setEntries] = useState<QueueEntry[]>(QUEUE_ENTRIES);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(
    () => entries.filter((e) => e.doctor === doctorName).sort((a, b) => a.token.localeCompare(b.token)),
    [entries]
  );
  const selected = list.find((e) => e.id === openId) || null;

  const counts = {
    waiting: list.filter((e) => e.status === "waiting").length,
    called: list.filter((e) => e.status === "called").length,
    completed: list.filter((e) => e.status === "completed").length,
  };

  const start = (id: string) => {
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, status: "called" } : e)));
    toast.success("Consultation started.");
  };
  const complete = (id: string) => {
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, status: "completed" } : e)));
    setOpenId(null);
    toast.success("Marked completed.");
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Doctor workspace</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Today's patients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · Medicine · Room 204 · Tuesday, 19 Apr 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stat icon={Users2} label="Total" value={list.length} tone="primary" />
          <Stat icon={Activity} label="Waiting" value={counts.waiting} tone="warning" />
          <Stat icon={CheckCircle2} label="Done" value={counts.completed} tone="success" />
        </div>
      </header>

      <GlassCard variant="strong" className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Patient list</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">Tap a row to preview</span>
        </div>

        <div className="divide-y divide-border/50">
          {/* Header row (desktop) */}
          <div className="hidden md:grid grid-cols-[80px_1.4fr_1.6fr_1fr_140px] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20">
            <div>Token</div>
            <div>Patient</div>
            <div>Visit reason</div>
            <div>AI suggestion</div>
            <div className="text-right">Status</div>
          </div>

          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => setOpenId(e.id)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-[80px_1.4fr_1.6fr_1fr_140px] gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-9 w-14 rounded-lg bg-primary/10 ring-1 ring-primary/30 text-primary text-xs font-bold">
                  {e.token}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{e.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{e.phone} · arrived {e.arrived}</div>
              </div>
              <div className="text-sm text-foreground/90 truncate">{e.reason}</div>
              <div>
                {e.aiDept ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 ring-1 ring-primary/25 text-primary text-[11px] px-2 py-0.5">
                    <Sparkles className="h-3 w-3" /> {e.aiDept}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </div>
              <div className="md:text-right">
                <StatusPill status={e.status} />
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Consultation side panel */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-card/95 backdrop-blur-xl border-l-border/60 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-14 grid place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30 text-primary font-bold">
                    {selected.token}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selected.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {selected.phone} · arrived {selected.arrived}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-muted/30 ring-1 ring-border/50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Visit reason</div>
                  <div className="text-sm">{selected.reason}</div>
                </div>

                {selected.aiDept && (
                  <div className="rounded-xl bg-primary/5 ring-1 ring-primary/20 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">AI department suggestion</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 ring-1 ring-primary/30 text-primary text-xs px-2.5 py-1 font-medium">
                        <Sparkles className="h-3 w-3" /> {selected.aiDept}
                      </span>
                      {selected.aiDept !== selected.dept && (
                        <span className="text-[11px] text-warning">≠ booked dept ({selected.dept})</span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Uploaded reports</div>
                  {selected.hasReports ? (
                    <div className="grid grid-cols-2 gap-2">
                      <ReportTile name="CBC_Report.pdf" size="412 KB" type="pdf" />
                      <ReportTile name="ECG_Scan.jpg" size="1.2 MB" type="image" />
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-4 text-center">
                      No reports uploaded.
                    </div>
                  )}
                </div>

                <AIDisclaimer />

                <div className="flex gap-2 pt-2 sticky bottom-0 bg-card/95 backdrop-blur-md -mx-6 px-6 py-3 border-t border-border/60">
                  {selected.status !== "completed" && (
                    <>
                      <Button onClick={() => start(selected.id)} className="flex-1 bg-gradient-emerald text-primary-foreground shadow-glow">
                        <Play className="h-4 w-4" /> Start consultation
                      </Button>
                      <Button onClick={() => complete(selected.id)} variant="outline" className="flex-1">
                        <CheckCircle2 className="h-4 w-4" /> Mark completed
                      </Button>
                    </>
                  )}
                  {selected.status === "completed" && (
                    <div className="flex-1 text-center text-sm text-muted-foreground py-2">
                      Visit completed
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users2; label: string; value: number; tone: "primary" | "warning" | "success" }) {
  const cls =
    tone === "warning" ? "bg-warning/15 text-warning"
    : tone === "success" ? "bg-success/15 text-success"
    : "bg-primary/15 text-primary";
  return (
    <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
      <div className={`h-8 w-8 rounded-lg grid place-items-center ${cls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-base font-bold leading-none">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function ReportTile({ name, size, type }: { name: string; size: string; type: "pdf" | "image" }) {
  const Icon = type === "pdf" ? FileText : ImageIcon;
  return (
    <div className="rounded-xl ring-1 ring-border/50 bg-muted/20 p-3 hover:bg-muted/30 cursor-pointer transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{name}</div>
          <div className="text-[10px] text-muted-foreground">{size}</div>
        </div>
      </div>
      <div className="h-16 rounded-md bg-gradient-to-br from-muted/40 to-muted/10 grid place-items-center text-[10px] text-muted-foreground">
        Preview
      </div>
    </div>
  );
}
