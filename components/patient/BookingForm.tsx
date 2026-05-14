"use client"

import { useState, useTransition, useEffect } from "react";
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
  CheckCircle2, AlertCircle, Loader2, Banknote
} from "lucide-react";
import { bookAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BookingFormProps {
  departments: any[];
  initialDept?: string;
}

export function BookingForm({ departments, initialDept }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDeptId, setSelectedDeptId] = useState(departments.find(d => d.name === initialDept)?.id || "");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const doctors = selectedDept?.doctors || [];
  const selectedDoctor = doctors.find((d: any) => d.id === selectedDocId);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (selectedDocId && selectedDate) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        try {
          const res = await fetch(`/api/doctors/${selectedDocId}/slots?date=${selectedDate}`);
          const result = await res.json();
          if (result.success) {
            setSlots(result.data);
          } else {
            setSlots([]);
          }
        } catch (error) {
          console.error("Failed to fetch slots", error);
          setSlots([]);
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setSlots([]);
    }
  }, [selectedDocId, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !selectedSlotId) {
      toast.error("Please select a doctor and an available slot.");
      return;
    }

    const selectedSlot = slots.find(s => s.id === selectedSlotId);
    if (!selectedSlot) return;

    const formData = new FormData();
    formData.append("doctorId", selectedDocId);
    formData.append("departmentId", selectedDeptId);
    formData.append("scheduledAt", selectedSlot.startTime);
    formData.append("slotId", selectedSlotId);
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
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specialization</Label>
                <Select value={selectedDeptId} onValueChange={(val) => { setSelectedDeptId(val); setSelectedDocId(""); setSelectedSlotId(""); }}>
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
                <Select value={selectedDocId} onValueChange={(val) => { setSelectedDocId(val); setSelectedSlotId(""); }} disabled={!selectedDeptId}>
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Available Slots</Label>
                <div className="flex items-center gap-2">
                   <input
                    type="date"
                    className="glass rounded-lg px-3 py-1 text-xs outline-none border border-border/20 focus:border-primary/50"
                    value={selectedDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlotId(""); }}
                  />
                </div>
              </div>

              {isLoadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-xs">Finding available slots...</p>
                </div>
              ) : selectedDocId ? (
                slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                          selectedSlotId === slot.id
                            ? "bg-primary text-primary-foreground border-primary shadow-glow scale-[1.02]"
                            : "glass border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {format(new Date(slot.startTime), 'h:mm a')}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center glass rounded-2xl border-dashed border-2 border-border/40 opacity-60">
                    <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/30" />
                    <p className="text-xs font-medium">No slots available for this date.</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Please try selecting another date.</p>
                  </div>
                )
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center glass rounded-2xl border-dashed border-2 border-border/40 opacity-40">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-xs">Select a doctor to view availability</p>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Symptoms / Notes</Label>
             <Textarea
              className="min-h-[120px] glass rounded-xl border-border/40 focus:ring-primary/20 resize-none p-4"
              placeholder="Briefly describe your symptoms or reason for visit..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard variant="strong" className="space-y-6 h-fit sticky top-24">
            <h3 className="font-bold text-lg">Booking Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Doctor</div>
                  <div className="text-sm font-bold">{selectedDoctor?.user.name || "None selected"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule</div>
                  <div className="text-sm font-bold">
                    {selectedSlotId 
                      ? format(new Date(slots.find(s => s.id === selectedSlotId)?.startTime), 'PPP p')
                      : "No slot selected"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consultation Fee</div>
                  <div className="text-sm font-black text-gradient-emerald">
                    ৳{selectedDoctor?.consultationFee || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/20">
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground h-14 text-md font-bold rounded-2xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                disabled={isPending || !selectedSlotId}
              >
                {isPending ? "Booking..." : "Confirm Visit"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Instant Confirmation
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Secure your position. You will receive a live token once you check in at the hospital.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </form>
  );
}

