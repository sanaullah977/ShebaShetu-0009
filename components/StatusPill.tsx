import { cn } from "@/lib/utils";

type Status = 
  | "live" | "upcoming" | "completed" | "waiting" | "called" | "delayed" | "absent"
  | "pending" | "confirmed" | "checked_in" | "in_progress" | "cancelled" | "no_show";

const MAP: Record<string, { label: string; cls: string; dot?: string }> = {
  live:        { label: "In progress", cls: "bg-primary/15 text-primary border-primary/30",     dot: "bg-primary" },
  upcoming:    { label: "Upcoming",    cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",     dot: "bg-sky-400" },
  completed:   { label: "Completed",   cls: "bg-muted/40 text-muted-foreground border-border" },
  waiting:     { label: "Waiting",     cls: "bg-warning/15 text-warning border-warning/30",     dot: "bg-warning" },
  called:      { label: "Called",      cls: "bg-primary/20 text-primary border-primary/40",     dot: "bg-primary" },
  delayed:     { label: "Delayed",     cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  absent:      { label: "Absent",      cls: "bg-destructive/15 text-destructive border-destructive/30" },
  
  // Appointment Statuses
  pending:     { label: "Pending",     cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", dot: "bg-amber-500" },
  confirmed:   { label: "Confirmed",   cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", dot: "bg-emerald-500" },
  checked_in:  { label: "Checked In",  cls: "bg-blue-500/15 text-blue-500 border-blue-500/30", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", cls: "bg-primary/15 text-primary border-primary/30",     dot: "bg-primary" },
  cancelled:   { label: "Cancelled",   cls: "bg-destructive/15 text-destructive border-destructive/30" },
  no_show:     { label: "No Show",      cls: "bg-muted/40 text-muted-foreground border-border" },
};

const DEFAULT = { label: "Unknown", cls: "bg-muted/20 text-muted-foreground border-border" };

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const s = status?.toLowerCase() || "unknown";
  const m = MAP[s] || DEFAULT;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border whitespace-nowrap",
      m.cls, className
    )}>
      {m.dot && (
        s === "live" || s === "called" || s === "in_progress"
          ? <span className="live-dot" />
          : <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      )}
      {m.label}
    </span>
  );
}
