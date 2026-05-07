import { cn } from "@/lib/utils";

type Status = "live" | "upcoming" | "completed" | "waiting" | "called" | "delayed" | "absent";

const MAP: Record<Status, { label: string; cls: string; dot?: string }> = {
  live:      { label: "In progress", cls: "bg-primary/15 text-primary border-primary/30",     dot: "bg-primary" },
  upcoming:  { label: "Upcoming",    cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",     dot: "bg-sky-400" },
  completed: { label: "Completed",   cls: "bg-muted/40 text-muted-foreground border-border" },
  waiting:   { label: "Waiting",     cls: "bg-warning/15 text-warning border-warning/30",     dot: "bg-warning" },
  called:    { label: "Called",      cls: "bg-primary/20 text-primary border-primary/40",     dot: "bg-primary" },
  delayed:   { label: "Delayed",     cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  absent:    { label: "Absent",      cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const m = MAP[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border",
      m.cls, className
    )}>
      {m.dot && (
        status === "live" || status === "called"
          ? <span className="live-dot" />
          : <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      )}
      {m.label}
    </span>
  );
}
