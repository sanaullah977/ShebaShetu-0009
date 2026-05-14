"use client"

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  CalendarDays, Clock, User,
  Stethoscope, ShieldCheck, ArrowRight,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { bookAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  departments: any[];
  initialDept?: string;
}

export function BookingForm({ departments, initialDept }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDeptId, setSelectedDeptId] = useState(departments.find(d => d.name === initialDept)?.id || "");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const doctors = selectedDept?.doctors || [];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !scheduledAt) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("doctorId", selectedDocId);
    formData.append("departmentId", selectedDeptId);
    formData.append("scheduledAt", scheduledAt);
    formData.append("symptoms", symptoms);

    startTransition(async () => {
      const result = await bookAppointment(formData);
      if (result.success) {
        toast.success("Appointment booked successfully!");
        router.push("/patient/appointments");
      } else {
        toast.error(result.error || "Booking failed.");
      }
    });
  };

  return (
    <form onSubmit={handleBooking} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specialization</Label>
            <Select value={selectedDeptId} onValueChange={(val) => { setSelectedDeptId(val); setSelectedDocId(""); }}>
              <SelectTrigger className="h-12 glass rounded-xl border-border/40 focus:ring-primary/20">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/40">
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Doctor</Label>
            <Select value={selectedDocId} onValueChange={setSelectedDocId} disabled={!selectedDeptId}>
              <SelectTrigger className="h-12 glass rounded-xl border-border/40 focus:ring-primary/20">
                <SelectValue placeholder={selectedDeptId ? "Select Doctor" : "Choose department first"} />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/40">
                {doctors.map((doc: any) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.user.name} ({doc.specialization || "General"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date & Time</Label>
            <div className="relative group">
              <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="datetime-local"
                className="w-full h-12 glass rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Symptoms / Notes</Label>
            <Textarea
              className="min-h-[148px] glass rounded-xl border-border/40 focus:ring-primary/20 resize-none p-4"
              placeholder="e.g., Mild fever since morning, persistent headache..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Instant Confirmation
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your appointment will be confirmed instantly. You can track your position in the live queue on the day of your visit.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground h-14 text-md font-bold rounded-2xl shadow-glow hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
        disabled={isPending || !selectedDocId || !scheduledAt}
      >
        {isPending ? "Processing your booking..." : "Confirm & Book Visit"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/20">
        {[
          { icon: CheckCircle2, text: "Verified Doctors" },
          { icon: ShieldCheck, text: "Secure Booking" },
          { icon: Clock, text: "Live Queue Tracking" }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
            <item.icon className="h-3.5 w-3.5" /> {item.text}
          </div>
        ))}
      </div>
    </form>
  );
}
