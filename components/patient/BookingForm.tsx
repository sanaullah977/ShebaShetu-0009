"use client"

import { useMemo, useState, useTransition } from "react";
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
  CheckCircle2, AlertCircle, Building2
} from "lucide-react";
import { bookAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type BookingDoctor = {
  id: string;
  user: { id: string; name: string | null; image: string | null };
  specialization: string | null;
  consultationFee: number | null;
  roomNumber?: string | null;
  departments: Array<{
    id: string;
    name: string;
    hospital?: { id: string; name: string; address: string } | null;
  }>;
  schedules: Array<{
    id: string;
    hospitalId: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    isBooked: boolean;
    hospital?: { id: string; name: string; address: string } | null;
  }>;
};

interface BookingFormProps {
  doctors: BookingDoctor[];
  initialSpecialization?: string;
}

export function BookingForm({ doctors, initialSpecialization }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const specializationOptions = useMemo(() => {
    const values = new Set<string>();
    doctors.forEach((doctor) => {
      if (doctor.specialization?.trim()) values.add(doctor.specialization.trim());
      doctor.departments.forEach((department) => {
        if (department.name?.trim()) values.add(department.name.trim());
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  const initialOption = specializationOptions.find(
    (option) => option.toLowerCase() === initialSpecialization?.toLowerCase()
  );

  const [selectedSpecialization, setSelectedSpecialization] = useState(initialOption || "");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialization) return [];
    const needle = selectedSpecialization.toLowerCase();
    return doctors.filter((doctor) => (
      doctor.specialization?.toLowerCase() === needle ||
      doctor.departments.some((department) => department.name.toLowerCase() === needle)
    ));
  }, [doctors, selectedSpecialization]);

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDocId);
  const selectedSlot = selectedDoctor?.schedules.find((slot) => slot.id === selectedSlotId);
  const availableDates = useMemo(() => {
    if (!selectedDoctor) return [];
    return Array.from(new Set(selectedDoctor.schedules.map((slot) => toDateInput(slot.startTime)))).sort();
  }, [selectedDoctor]);

  const dateSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];
    return selectedDoctor.schedules.filter((slot) => toDateInput(slot.startTime) === selectedDate);
  }, [selectedDoctor, selectedDate]);

  const handleSpecializationChange = (value: string) => {
    setSelectedSpecialization(value);
    setSelectedDocId("");
    setSelectedDeptId("");
    setSelectedDate("");
    setSelectedSlotId("");
  };

  const selectDoctor = (doctor: BookingDoctor) => {
    const matchedDepartment = doctor.departments.find(
      (department) => department.name.toLowerCase() === selectedSpecialization.toLowerCase()
    );

    setSelectedDocId(doctor.id);
    setSelectedDeptId(matchedDepartment?.id || doctor.departments[0]?.id || "");
    setSelectedDate("");
    setSelectedSlotId("");
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDeptId || !selectedSlot) {
      toast.error("Please select a doctor, date, and available slot.");
      return;
    }

    const formData = new FormData();
    formData.append("doctorId", selectedDoctor.id);
    formData.append("departmentId", selectedDeptId);
    formData.append("scheduleSlotId", selectedSlot.id);
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
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specialization</Label>
            <Select value={selectedSpecialization} onValueChange={handleSpecializationChange}>
              <SelectTrigger className="h-12 glass rounded-xl border-border/40 focus:ring-primary/20">
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/40">
                {specializationOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {specializationOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">No active doctor specializations are available right now.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Doctor</Label>
            <div className="space-y-2">
              {selectedSpecialization ? (
                filteredDoctors.length > 0 ? filteredDoctors.map((doctor) => {
                  const isSelected = selectedDocId === doctor.id;
                  return (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => selectDoctor(doctor)}
                      className={cn(
                        "w-full text-left glass rounded-xl border p-4 transition-all",
                        isSelected ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20" : "border-border/40 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate">{doctor.user.name || "Doctor"}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{doctor.specialization || "General Medicine"}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                }) : (
                  <EmptyState message="No doctors are currently available for this specialization." />
                )
              ) : (
                <EmptyState message="Choose a specialization to see available doctors." />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDoctor ? (
            <GlassCard className="border-primary/20 bg-primary/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Selected Doctor</div>
                  <h3 className="text-xl font-black">{selectedDoctor.user.name || "Doctor"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialization || selectedSpecialization}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs">
                <Info label="Fee" value={selectedDoctor.consultationFee != null ? `${selectedDoctor.consultationFee} BDT` : "Not provided"} />
                <Info label="Room" value={selectedDoctor.roomNumber || "Assigned on arrival"} />
                <Info label="Hospitals" value={uniqueHospitals(selectedDoctor).join(", ") || "Not assigned"} />
                <Info label="Available Dates" value={availableDates.length ? `${availableDates.length} date(s)` : "No slots"} />
              </div>
            </GlassCard>
          ) : (
            <EmptyState message="Selected doctor details will appear here immediately after selection." tall />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
              <input
                type="date"
                className="w-full h-12 glass rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                value={selectedDate}
                min={availableDates[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlotId("");
                }}
                disabled={!selectedDoctor}
                required
              />
              {selectedDoctor && availableDates.length === 0 && (
                <p className="text-xs text-muted-foreground">This doctor has no open slots.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</Label>
              <Select value={selectedDeptId} onValueChange={setSelectedDeptId} disabled={!selectedDoctor || (selectedDoctor?.departments.length ?? 0) <= 1}>
                <SelectTrigger className="h-12 glass rounded-xl border-border/40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border/40">
                  {selectedDoctor?.departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Available Slots</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {selectedDoctor && selectedDate ? (
                dateSlots.length > 0 ? dateSlots.map((slot) => {
                  const disabled = slot.isBooked || !slot.isAvailable;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        selectedSlotId === slot.id ? "border-primary bg-primary/10" : "glass border-border/40",
                        disabled && "cursor-not-allowed opacity-40"
                      )}
                    >
                      <div className="text-sm font-bold">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" /> {slot.hospital?.name || "Hospital"}
                      </div>
                    </button>
                  );
                }) : (
                  <EmptyState message="No slots are available for this doctor on the selected date." />
                )
              ) : (
                <EmptyState message="Slots load after you select both a doctor and date." />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Symptoms / Notes</Label>
            <Textarea
              className="min-h-[118px] glass rounded-xl border-border/40 focus:ring-primary/20 resize-none p-4"
              placeholder="e.g., Mild fever since morning, persistent headache..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
        <AlertCircle className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Appointment creation is validated against the selected doctor's live schedule. Already booked slots are disabled and rechecked on submit.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground h-14 text-md font-bold rounded-2xl shadow-glow hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
        disabled={isPending || !selectedDoctor || !selectedSlotId || !selectedDeptId}
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

function EmptyState({ message, tall = false }: { message: string; tall?: boolean }) {
  return (
    <div className={cn("glass rounded-xl border border-dashed border-border/50 p-4 text-xs text-muted-foreground", tall && "min-h-[160px] grid place-items-center text-center")}>
      {message}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border/30 p-3">
      <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{label}</div>
      <div className="font-bold mt-1">{value}</div>
    </div>
  );
}

function toDateInput(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uniqueHospitals(doctor: BookingDoctor) {
  return Array.from(new Set(doctor.schedules.map((slot) => slot.hospital?.name).filter(Boolean) as string[]));
}
