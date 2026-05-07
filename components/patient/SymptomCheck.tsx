"use client"

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function SymptomCheck() {
  const router = useRouter();
  const [symptom, setSymptom] = useState("");

  const handleSuggest = () => {
    if (!symptom.trim()) return;
    router.push(`/patient/symptoms?symptom=${encodeURIComponent(symptom)}`);
  };

  return (
    <GlassCard variant="strong" className="lg:col-span-2 relative overflow-hidden">
      <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-[80px]" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Quick symptom check</div>
            <div className="text-sm font-semibold">What's bothering you today?</div>
          </div>
        </div>

        <Textarea
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="e.g. Sharp chest pain since morning, mild fever, dizziness when standing…"
          className="min-h-[110px] glass border-border/60 text-sm"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {["Chest pain", "Fever 3 days", "Joint pain", "Cough & cold", "Stomach ache"].map((q) => (
            <button
              key={q}
              onClick={() => setSymptom(q)}
              className="glass glass-hover rounded-full px-3 py-1 text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
          <p className="text-[11px] text-muted-foreground max-w-md">
            ShebaSetu AI will suggest a department in seconds. You can always pick manually.
          </p>
          <Button
            onClick={handleSuggest}
            className="bg-gradient-emerald text-primary-foreground shadow-glow"
            disabled={!symptom.trim()}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Get AI department suggestion
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
