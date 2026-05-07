import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { QUEUE_AHEAD } from "@/lib/mock-data";
import { Bell, MapPin, Phone, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LiveQueue() {
  const navigate = useNavigate();
  const [ahead, setAhead] = useState(3);
  const [eta, setEta] = useState(18);
  const [progress, setProgress] = useState(62);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 96 ? 60 : p + 1));
      setEta((e) => (e <= 6 ? 22 : e - 1));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAhead((a) => (a <= 1 ? 4 : a - 1)), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patient · Live queue</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">You're almost up.</h1>
          <p className="text-sm text-muted-foreground mt-1">Stay nearby — you'll be called soon.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="glass border-border/60"><RefreshCw className="h-4 w-4 mr-1.5" /> Refresh</Button>
          <Button className="bg-gradient-emerald text-primary-foreground shadow-glow"><Bell className="h-4 w-4 mr-1.5" /> Notify me</Button>
        </div>
      </div>

      {/* Hero */}
      <GlassCard variant="strong" className="relative overflow-hidden p-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-primary/15 blur-[120px]" />
        <div className="relative px-6 py-10 sm:py-14 text-center">
          <StatusPill status="live" className="mx-auto" />
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-5">Your token</div>
          <div className="text-7xl sm:text-8xl font-bold text-gradient-emerald mt-1 leading-none">A-24</div>
          <div className="text-sm text-muted-foreground mt-3">Dr. Anika Rahman · Medicine · Room 204</div>

          <div className="mt-8 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-emerald shadow-glow transition-all duration-700 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,hsl(var(--primary-glow)/0.5),transparent)] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="glass rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">In queue</div>
                <div className="text-2xl font-bold mt-0.5">#{ahead}</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ETA</div>
                <div className="text-2xl font-bold mt-0.5">~{eta}<span className="text-sm text-muted-foreground"> min</span></div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Now serving</div>
                <div className="text-2xl font-bold mt-0.5 text-primary">A-{27 - ahead}</div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-[1fr,300px] gap-5">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">People ahead of you</div>
              <div className="text-xs text-muted-foreground">Identities are anonymized to protect privacy.</div>
            </div>
            <span className="text-[11px] glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <span className="live-dot" /> Live
            </span>
          </div>
          <div className="space-y-2">
            {QUEUE_AHEAD.slice(0, ahead).map((p, i) => (
              <div key={p.token} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="text-[11px] text-muted-foreground w-6 text-center">#{i + 1}</div>
                <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-[11px] font-semibold">{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">Token {p.token}</div>
                  <div className="text-[11px] text-muted-foreground">{p.reason} · waited {p.waited}</div>
                </div>
                <StatusPill status={i === 0 ? "called" : "waiting"} />
              </div>
            ))}
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 ring-1 ring-primary/40 shadow-glow">
              <div className="text-[11px] text-primary w-6 text-center font-bold">YOU</div>
              <div className="h-10 w-10 rounded-full bg-gradient-emerald grid place-items-center text-[11px] font-semibold text-primary-foreground">NA</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Token A-24</div>
                <div className="text-[11px] text-muted-foreground">Your visit · arrives ~{eta}m</div>
              </div>
              <StatusPill status="upcoming" />
            </div>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <GlassCard>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Where to go</div>
            <div className="text-sm font-semibold">Block B · 2nd floor · Room 204</div>
            <p className="text-xs text-muted-foreground mt-1">Take the lift on your right after entering the OPD lobby.</p>
            <Button variant="outline" className="glass border-border/60 w-full mt-3"><MapPin className="h-4 w-4 mr-1.5" /> Open map</Button>
          </GlassCard>
          <GlassCard>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Reception desk</div>
            <div className="text-sm font-semibold">+880 1700 123 456</div>
            <Button variant="outline" className="glass border-border/60 w-full mt-3"><Phone className="h-4 w-4 mr-1.5" /> Call reception</Button>
          </GlassCard>
          <Button onClick={() => navigate("/patient")} variant="ghost" className="w-full">Back to dashboard</Button>
        </div>
      </div>
    </div>
  );
}
