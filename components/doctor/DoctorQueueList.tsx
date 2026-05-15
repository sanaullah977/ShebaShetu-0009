"use client"

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Clock, FileText, Loader2, User } from "lucide-react";
import { startAppointment } from "@/app/actions/doctor";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusPill";
import { toast } from "sonner";

interface DoctorQueueListProps {
  appointments: any[];
  hasActiveAppointment: boolean;
}

export function DoctorQueueList({ appointments, hasActiveAppointment }: DoctorQueueListProps) {
  const router = useRouter();
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStart = (appointmentId: string) => {
    if (hasActiveAppointment || isPending) return;
    setPendingId(appointmentId);

    startTransition(async () => {
      const result = await startAppointment(appointmentId);
      setPendingId(null);

      if (result.success) {
        toast.success("Checkup started");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to start checkup");
      }
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="py-12 text-center opacity-40">
        <FileText className="h-10 w-10 mx-auto mb-3" />
        <p className="text-sm">No patients waiting in queue.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group hover:bg-sidebar-accent/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{apt.patient?.user?.name || "Unknown patient"}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" /> {format(new Date(apt.scheduledAt), "h:mm a")}
                  {apt.queueToken && <span className="ml-2 font-bold text-primary">Token {apt.queueToken.tokenNumber}</span>}
                  {apt.department?.name && <span className="ml-2">{apt.department.name}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <StatusPill status={apt.status.toLowerCase() as any} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3"
                onClick={() => setSelectedAppointment(apt)}
              >
                Details
              </Button>
              {!hasActiveAppointment && (
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleStart(apt.id)}
                  className="h-8 rounded-lg bg-primary text-[10px] font-bold uppercase tracking-wider px-3"
                >
                  {pendingId === apt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Start Checkup"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="glass-strong border-border/60 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Patient and queue information for this appointment.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-3 text-sm">
              <Detail label="Patient" value={selectedAppointment.patient?.user?.name || "Unknown"} />
              <Detail label="Department" value={selectedAppointment.department?.name || "Not provided"} />
              <Detail label="Hospital" value={selectedAppointment.hospital?.name || "Not provided"} />
              <Detail label="Time" value={format(new Date(selectedAppointment.scheduledAt), "PPP p")} />
              <Detail label="Status" value={selectedAppointment.status || "PENDING"} />
              <Detail label="Token" value={selectedAppointment.queueToken?.tokenNumber || "Not checked in"} />
              <Detail label="Blood Group" value={selectedAppointment.patient?.bloodGroup || "Not provided"} />
              <Detail label="Age / Gender" value={`${selectedAppointment.patient?.age ?? "N/A"} / ${selectedAppointment.patient?.gender || "Not provided"}`} />
              <div className="rounded-xl bg-background/40 border border-border/40 p-3">
                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Reason / Symptoms</div>
                <div className="text-sm">{selectedAppointment.symptoms || "No symptoms provided."}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background/40 border border-border/40 p-3">
      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}
