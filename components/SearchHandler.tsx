"use client"

import { useEffect, useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, Search, User, CalendarDays, Ticket, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { errorMessage, parseJsonResponse } from "@/lib/http";

export function SearchHandler() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleSearch = (e: any) => {
      setQuery(e.detail);
      setOpen(true);
      performSearch(e.detail);
    };

    window.addEventListener("app-search", handleSearch);
    return () => window.removeEventListener("app-search", handleSearch);
  }, []);

  const performSearch = async (q: string) => {
    if (!q || q.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await parseJsonResponse<{ results: any[] }>(res, "Search failed.");
      setResults(data.results || []);
    } catch (error) {
      console.error(errorMessage(error, "Search failed."));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PATIENT": return <User className="h-4 w-4 text-emerald-500" />;
      case "DOCTOR": return <User className="h-4 w-4 text-blue-500" />;
      case "TOKEN": return <Ticket className="h-4 w-4 text-amber-500" />;
      default: return <CalendarDays className="h-4 w-4 text-primary" />;
    }
  };

  const handleResultClick = (r: any) => {
    setOpen(false);
    if (r.type === "TOKEN") {
      window.location.href = `/reception/queue?search=${r.title}`;
    } else if (r.type === "PATIENT") {
      window.location.href = `/reception/queue?action=checkin&patientId=${r.id}`;
    } else if (r.type === "DOCTOR") {
      window.location.href = `/reception/schedule?doctorId=${r.id}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong border-border/60 sm:max-w-xl p-0 overflow-hidden gap-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Search className="h-5 w-5" />
            </div>
            Search Results
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-3 min-h-[350px] max-h-[65vh] overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            Results for <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">{query}</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-60">
              <div className="relative mb-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 h-12 w-12 border-4 border-primary/10 rounded-full" />
              </div>
              <div className="text-sm font-bold tracking-tight animate-pulse">Searching clinical records...</div>
            </div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <div 
                key={i} 
                onClick={() => handleResultClick(r)}
                className="glass border-border/20 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                    {getIcon(r.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-black tracking-tight">{r.title}</div>
                      {r.type === "TOKEN" && (
                        <Badge className={cn(
                          "text-[9px] px-1.5 py-0 uppercase font-black tracking-tighter border-none shadow-none",
                          r.status === "WAITING" ? "bg-amber-500/10 text-amber-600" : 
                          r.status === "CALLED" ? "bg-blue-500/10 text-blue-600" :
                          "bg-emerald-500/10 text-emerald-600"
                        )}>
                          {r.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">{r.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                    <ArrowUpRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
               <div className="h-24 w-24 rounded-[2rem] bg-secondary/30 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
                 <Search className="h-12 w-12 text-muted-foreground/30 -rotate-12" />
               </div>
               <div>
                 <p className="text-lg font-black tracking-tight">No matches found</p>
                 <p className="text-xs text-muted-foreground mt-2 max-w-[240px] font-medium leading-relaxed">
                   We couldn't find any records matching <span className="text-foreground">"{query}"</span>. 
                   Try adjusting your search terms.
                 </p>
               </div>
               <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-border/40 font-bold text-[11px] uppercase tracking-widest h-10 px-6">
                 Close Search
               </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
