import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { AIDisclaimer } from "@/components/AIDisclaimer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Wand2, Stethoscope, Star, RefreshCw, ListFilter } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DEPARTMENTS, DOCTORS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function SymptomFlow() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { symptom?: string } };
  const [symptom, setSymptom] = useState(location.state?.symptom ?? "");
  const [stage, setStage] = useState<"input" | "loading" | "result">("input");

  const handleAnalyze = () => {
    if (!symptom.trim()) return;
    setStage("loading");
    setTimeout(() => setStage("result"), 1400);
  };

  if (stage === "input") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-[11px] font-medium">
            <Sparkles className="h-3 w-3 text-primary" /> Step 1 of 2 · Describe symptoms
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Tell us what feels off.
          </h1>
          <p className="text-muted-foreground text-sm">
            Plain language is fine. ShebaSetu AI reads it and suggests the right department.
          </p>
        </div>

        <GlassCard variant="strong" className="relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/15 blur-[100px]" />
          <div className="relative">
            <Textarea
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="Example: I've had a sharp pain in my chest for 2 days, especially when I climb stairs. Sometimes I feel dizzy."
              className="min-h-[200px] glass border-border/60 text-base leading-relaxed"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {["Chest tightness", "Severe headache", "High fever", "Knee pain", "Pregnancy follow-up", "Child cough"].map((q) => (
                <button key={q} onClick={() => setSymptom((s) => (s ? s + " " + q : q))} className="glass glass-hover rounded-full px-3 py-1 text-[11px]">
                  + {q}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        <AIDisclaimer />

        <div className="flex justify-between gap-3">
          <Button variant="outline" className="glass border-border/60" onClick={() => navigate("/patient/book")}>
            <ListFilter className="h-4 w-4 mr-1.5" /> Skip, choose manually
          </Button>
          <Button onClick={handleAnalyze} disabled={!symptom.trim()} size="lg" className="bg-gradient-emerald text-primary-foreground shadow-glow">
            <Wand2 className="h-4 w-4 mr-1.5" /> Analyze with AI
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="relative h-24 w-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <div className="relative h-full w-full rounded-full glass-strong grid place-items-center">
            <Sparkles className="h-9 w-9 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-bold">Analyzing your symptoms…</h2>
        <p className="text-sm text-muted-foreground mt-1">Matching against 800+ care patterns</p>
      </div>
    );
  }

  // Result
  const suggested = DEPARTMENTS[1]; // Cardiology demo
  const SuggestedIcon = suggested.icon;
  const suggestedDoctor = DOCTORS.find((d) => d.dept === suggested.id)!;
  const alternatives = DEPARTMENTS.filter((d) => d.id !== suggested.id).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-xs">
        <span className="glass rounded-full px-2.5 py-1">Step 2 of 2</span>
        <span className="text-muted-foreground">AI suggestion ready</span>
      </div>

      <GlassCard variant="strong" glow className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-emerald grid place-items-center shadow-glow">
              <SuggestedIcon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Recommended department</div>
              <h2 className="text-2xl sm:text-3xl font-bold">{suggested.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] glass rounded-full px-2 py-0.5">94% match confidence</span>
                <span className="text-[11px] text-muted-foreground">based on your symptoms</span>
              </div>
            </div>
          </div>

          <div className="mt-5 glass rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Why this department</div>
            <p className="text-sm leading-relaxed">
              You mentioned <span className="text-foreground font-medium">chest pain</span> with
              <span className="text-foreground font-medium"> dizziness on exertion</span>. These suggest a cardiovascular review. A
              {" "}<span className="text-primary font-medium">{suggested.name}</span> specialist can run an ECG and rule out causes quickly.
            </p>
          </div>

          <div className="mt-4 glass rounded-xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center text-sm font-semibold">
              {suggestedDoctor.name.split(" ").slice(1, 3).map((n) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{suggestedDoctor.name}</div>
              <div className="text-xs text-muted-foreground">{suggested.name} · {suggestedDoctor.chamber}</div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-semibold">{suggestedDoctor.rating}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <AIDisclaimer />

      <div>
        <div className="text-xs text-muted-foreground mb-2">Other possible departments</div>
        <div className="grid sm:grid-cols-3 gap-3">
          {alternatives.map((d) => {
            const I = d.icon;
            return (
              <button key={d.id} onClick={() => navigate("/patient/book")} className={cn("glass glass-hover rounded-2xl p-3.5 text-left flex items-center gap-3")}>
                <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center">
                  <I className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">Lower confidence</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-between pt-2">
        <Button variant="outline" className="glass border-border/60" onClick={() => setStage("input")}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Re-describe
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="glass border-border/60" onClick={() => navigate("/patient/book")}>
            <Stethoscope className="h-4 w-4 mr-1.5" /> Choose manually
          </Button>
          <Button onClick={() => navigate("/patient/book", { state: { dept: suggested.id } })} className="bg-gradient-emerald text-primary-foreground shadow-glow">
            Continue with this <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
