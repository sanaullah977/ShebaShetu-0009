import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { APPOINTMENTS } from "@/lib/mock-data";
import { CalendarDays, Clock, MapPin, Pencil, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = ["upcoming", "live", "completed"] as const;
type Tab = typeof TABS[number];

export default function Appointments() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const navigate = useNavigate();

  const filtered = APPOINTMENTS.filter((a) => a.status === tab);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patient · Appointments</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">My Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your upcoming and past hospital visits.</p>
        </div>
        <Button onClick={() => navigate("/patient/book")} className="bg-gradient-emerald text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4 mr-1.5" /> New booking
        </Button>
      </div>

      {/* Tabs */}
      <div className="glass rounded-full p-1 inline-flex">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-full capitalize transition-all",
              tab === t
                ? "bg-gradient-emerald text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <GlassCard className="text-center py-12">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm font-semibold">No {tab} appointments</div>
            <div className="text-xs text-muted-foreground mt-1">Try another tab or book a new visit.</div>
          </GlassCard>
        )}

        {filtered.map((a) => (
          <GlassCard key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0 w-full sm:w-32 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Token</div>
              <div className="text-3xl font-bold text-gradient-emerald leading-none mt-1">{a.token}</div>
            </div>

            <div className="hidden sm:block w-px h-16 bg-border" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <StatusPill status={a.status as "live" | "upcoming" | "completed"} />
                <span className="text-[11px] text-muted-foreground">{a.dept}</span>
              </div>
              <div className="text-base font-semibold">{a.doctor}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {a.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Room 204</span>
              </div>
            </div>

            <div className="flex gap-2 sm:flex-col">
              {a.status === "live" && (
                <Button onClick={() => navigate("/patient/queue")} className="bg-gradient-emerald text-primary-foreground shadow-glow">
                  Open queue
                </Button>
              )}
              {a.status === "upcoming" && (
                <>
                  <Button variant="outline" className="glass border-border/60"><Pencil className="h-3.5 w-3.5 mr-1.5" /> Reschedule</Button>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10"><X className="h-3.5 w-3.5 mr-1.5" /> Cancel</Button>
                </>
              )}
              {a.status === "completed" && (
                <Button variant="outline" className="glass border-border/60">View summary</Button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
