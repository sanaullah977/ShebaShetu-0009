"use client"

import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";
import { Activity, User, ArrowRightLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QueueMovementsProps {
  movements: any[];
}

export function QueueMovements({ movements }: QueueMovementsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activities
        </h3>
        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
          Live Log
        </Badge>
      </div>

      <div className="grid gap-3">
        {movements.length > 0 ? (
          movements.map((log) => (
            <GlassCard key={log.id} className="p-4 flex items-start gap-4 group hover:bg-primary/[0.02] transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold truncate">
                    {log.action.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {typeof window !== 'undefined' && formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {log.details}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    Processed by {log.user?.name || "System"}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-[2rem] border-dashed border-border/60 opacity-60">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-bold">No movements recorded</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              When patient tokens are updated, the history will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
