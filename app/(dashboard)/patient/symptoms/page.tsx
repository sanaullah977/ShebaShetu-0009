"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowRight, Stethoscope, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SymptomsPage() {
  const searchParams = useSearchParams();
  const [symptoms, setSymptoms] = useState(searchParams.get("symptom") || "");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);

  const analyze = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/symptom-suggestion", {
        method: "POST",
        body: JSON.stringify({ symptoms }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.success) {
        setSuggestion(result.data);
      } else {
        toast.error("AI Analysis failed. Please try again.");
      }
    } catch (error) {
      toast.error("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("symptom")) {
      analyze();
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Symptom Guide</h1>
        <p className="text-muted-foreground mt-2">
          Describe how you feel, and our AI will suggest the most relevant department.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <GlassCard className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">What are your symptoms?</label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe in detail..."
              className="min-h-[200px] glass"
            />
          </div>
          <Button 
            onClick={analyze} 
            className="w-full bg-gradient-emerald text-primary-foreground shadow-glow"
            disabled={loading || !symptoms.trim()}
          >
            {loading ? "Analyzing..." : "Analyze Symptoms"}
            {!loading && <Sparkles className="ml-2 h-4 w-4" />}
          </Button>
        </GlassCard>

        <div className="space-y-6">
          {suggestion ? (
            <GlassCard variant="strong" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 grid place-items-center">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Suggestion</div>
                  <div className="text-lg font-bold">{suggestion.department}</div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Based on your description, we recommend visiting the **{suggestion.department}** department. 
                {suggestion.reason}
              </p>

              <Link href={`/patient/booking?dept=${encodeURIComponent(suggestion.department)}`}>
                <Button className="w-full bg-primary text-primary-foreground">
                  Book appointment in {suggestion.department}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </GlassCard>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40 border-2 border-dashed border-border rounded-2xl">
              <Sparkles className="h-12 w-12 mb-4" />
              <p className="text-sm">Your suggestion will appear here after analysis.</p>
            </div>
          )}

          <div className="glass p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Disclaimer:</strong> This AI tool is for guidance only and is not a medical diagnosis. 
              In case of emergency, please visit the ER immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
