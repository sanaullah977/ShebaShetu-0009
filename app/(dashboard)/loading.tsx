export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
        <div className="h-10 w-40 bg-muted rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-64 bg-muted/50 rounded-2xl border border-border/50" />
        <div className="h-64 bg-muted/50 rounded-2xl border border-border/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-48 bg-muted/50 rounded-2xl border border-border/50" />
        <div className="h-48 bg-muted/50 rounded-2xl border border-border/50" />
      </div>
    </div>
  );
}
