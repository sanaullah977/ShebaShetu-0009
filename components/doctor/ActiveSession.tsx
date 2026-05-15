"use client"

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { User, Activity, FileText, Pill, CheckCircle2, Loader2, History, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeAppointment, getPatientReportsForDoctor } from "@/app/actions/doctor";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

interface ActiveSessionProps {
  appointment: any;
  history?: any[];
}

export function ActiveSession({ appointment, history = [] }: ActiveSessionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reports, setReports] = useState<any[] | null>(null);

  const onComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const notes = formData.get("notes") as string;
    const prescription = formData.get("prescription") as string;

    const res = await completeAppointment(appointment.id, notes, prescription);
    setLoading(false);
    
    if (res.success) {
      toast.success("Session completed successfully");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const openReports = async () => {
    setReportsOpen(true);
    if (reports !== null || reportsLoading) return;

    setReportsLoading(true);
    const res = await getPatientReportsForDoctor(appointment.patientId);
    setReportsLoading(false);

    if (res.success) {
      setReports(res.reports || []);
    } else {
      toast.error(res.error || "Failed to load reports");
      setReports([]);
    }
  };

  return (
    <GlassCard className="border-primary/20 shadow-glow bg-primary/5">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Active Patient</div>
                <h2 className="text-2xl font-bold">{appointment?.patient?.user?.name || "Patient"}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                   <Activity className="h-3 w-3 text-emerald-500" /> Token {appointment?.queueToken?.tokenNumber || "N/A"} · Checkup in progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="glass text-xs h-8"
                onClick={openReports}
              >
                <FileText className="h-3 w-3 mr-2" />
                View Reports
              </Button>
              <Button
                variant="outline"
                className="glass text-xs h-8"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-3 w-3 mr-2" />
                {showHistory ? "Hide History" : "View History"}
              </Button>
            </div>
          </div>

          {!showHistory ? (
            <form onSubmit={onComplete} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
                  <FileText className="h-4 w-4 text-primary" /> Clinical Notes
                </label>
                <textarea 
                  name="notes"
                  rows={4}
                  className="w-full glass rounded-xl p-4 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none bg-background/40"
                  placeholder="Observe symptoms, diagnosis details..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
                  <Pill className="h-4 w-4 text-primary" /> Prescription
                </label>
                <textarea 
                  name="prescription"
                  rows={3}
                  className="w-full glass rounded-xl p-4 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none bg-background/40"
                  placeholder="Medicine names, dosage, duration..."
                  required
                />
              </div>

              <Button 
                disabled={loading} 
                className="w-full bg-primary text-primary-foreground h-12 text-base font-bold shadow-glow"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                Complete Checkup & Save
              </Button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-primary" /> Previous Visits ({history.length})
              </h4>
              {history.length > 0 ? (
                history.map((h: any) => (
                  <div key={h.id} className="p-4 glass rounded-xl space-y-3 bg-background/20">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="text-[11px] font-bold text-primary">{format(new Date(h.scheduledAt), "MMM d, yyyy")}</div>
                      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">Dr. {h.doctor?.user?.name?.split(" ").pop() || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Diagnosis/Notes</div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{h.clinicalNotes}"</p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 flex items-center gap-1">
                        <Pill className="h-3 w-3" /> Prescription
                      </div>
                      <p className="text-xs font-medium text-foreground/80">{h.prescription}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-40">
                  <History className="h-10 w-10 mx-auto mb-3" />
                  <p className="text-sm">No previous medical history found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full md:w-72 space-y-4 shrink-0">
          <div className="p-5 glass rounded-2xl bg-background/30">
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-4">Patient Information</h4>
            <div className="space-y-3.5">
               <div className="flex justify-between items-center text-xs pb-2 border-b border-border/20">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span className="font-bold text-primary">{appointment?.patient?.bloodGroup || "Not provided"}</span>
               </div>
               <div className="flex justify-between items-center text-xs pb-2 border-b border-border/20">
                  <span className="text-muted-foreground">Age / Gender</span>
                  <span className="font-bold">{appointment?.patient?.age ?? "N/A"} / {appointment?.patient?.gender || "Not provided"}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Patient ID</span>
                  <span className="font-mono text-[10px]">{appointment?.patient?.id?.slice(-6).toUpperCase() || "N/A"}</span>
               </div>
            </div>
          </div>
          
          <div className="p-5 glass rounded-2xl bg-orange-500/5 border border-orange-500/10">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-orange-500 tracking-widest mb-3">
              <Activity className="h-3.5 w-3.5" />
              Primary Symptoms
            </div>
            <p className="text-xs leading-relaxed italic text-foreground/70">
              "{appointment?.symptoms || "Patient has not provided specific symptoms for this visit."}"
            </p>
          </div>
        </div>
      </div>
      <Dialog open={reportsOpen} onOpenChange={setReportsOpen}>
        <DialogContent className="glass-strong border-border/60 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Reports</DialogTitle>
            <DialogDescription>
              Reports for the current active patient session only.
            </DialogDescription>
          </DialogHeader>
          {reportsLoading ? (
            <div className="py-12 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading reports...
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {reports.map((report) => {
                const downloadUrl = `/api/reports/${report.id}/download`;
                return (
                  <div key={report.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{report.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {report.type} · {format(new Date(report.uploadedAt), "PPP")} · {report.fileName || "No file name"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`${downloadUrl}?disposition=inline`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={downloadUrl}>
                          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No reports found for this patient.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
