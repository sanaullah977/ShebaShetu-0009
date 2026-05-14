"use client"

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { 
  User, Activity, FileText, Pill, CheckCircle2, 
  Loader2, History, FolderSearch, Download, Eye, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeAppointment, getPatientReportsForDoctor } from "@/app/actions/doctor";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface ActiveSessionProps {
  appointment: any;
  history?: any[];
}

export function ActiveSession({ appointment, history = [] }: ActiveSessionProps) {
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const fetchReports = async () => {
    setLoadingReports(true);
    const res = await getPatientReportsForDoctor(appointment.patientId);
    if (res.success) {
      setReports(res.reports || []);
    } else {
      toast.error(res.error);
    }
    setLoadingReports(false);
  };

  const onComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const notes = formData.get("notes") as string;
    const prescription = formData.get("prescription") as string;

    const res = await completeAppointment(appointment.id, notes, prescription);
    setLoading(false);
    
    if (res.success) toast.success("Session completed successfully");
    else toast.error(res.error);
  };

  const patient = appointment.patient;

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
                <h2 className="text-2xl font-bold">{patient.user.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                   <Activity className="h-3 w-3 text-emerald-500" /> Token {appointment.queueToken?.tokenNumber} · Checkup in progress
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={isReportsOpen} onOpenChange={(open) => {
                setIsReportsOpen(open);
                if (open) fetchReports();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="glass text-[10px] font-bold uppercase h-8 px-3">
                    <FolderSearch className="h-3.5 w-3.5 mr-2" />
                    View Reports
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-border/60 max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                      <FolderSearch className="h-5 w-5 text-primary" />
                      Patient Medical Reports
                    </DialogTitle>
                    <DialogDescription>
                      Viewing clinical documents for {patient.user.name}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-6 pt-2 flex-1 overflow-y-auto scrollbar-thin">
                    {loadingReports ? (
                      <div className="py-20 flex flex-col items-center justify-center opacity-40">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-xs">Fetching clinical records...</p>
                      </div>
                    ) : reports.length > 0 ? (
                      <div className="grid gap-3">
                        {reports.map((report) => (
                          <div key={report.id} className="glass border-border/20 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center">
                                   <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                   <div className="text-sm font-bold">{report.title}</div>
                                   <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">{report.type}</span>
                                      <span>•</span>
                                      <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" asChild>
                                   <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4" />
                                   </a>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                   <Download className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center opacity-40">
                        <FolderSearch className="h-12 w-12 mx-auto mb-4" />
                        <div className="text-sm font-bold">No reports found</div>
                        <p className="text-xs mt-1">This patient hasn't uploaded any documents yet.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-secondary/20 border-t border-border/20 flex justify-end">
                    <Button onClick={() => setIsReportsOpen(false)} className="h-9 rounded-xl bg-background text-foreground border border-border/40 hover:bg-secondary transition-all">
                       Close Records
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                className="glass text-[10px] font-bold uppercase h-8 px-3"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-3.5 w-3.5 mr-2" />
                {showHistory ? "Current Session" : "History"}
              </Button>
            </div>
          </div>

          {!showHistory ? (
            <form onSubmit={onComplete} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Clinical Notes
                </label>
                <textarea 
                  name="notes"
                  rows={4}
                  className="w-full bg-background/50 border border-border/40 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                  placeholder="Observe symptoms, diagnosis details, clinical findings..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" /> Prescription
                </label>
                <textarea 
                  name="prescription"
                  rows={3}
                  className="w-full bg-background/50 border border-border/40 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                  placeholder="Medicine names, dosage, duration, special instructions..."
                  required
                />
              </div>

              <Button 
                disabled={loading} 
                className="w-full bg-primary text-primary-foreground h-14 text-base font-black shadow-glow rounded-2xl transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                Complete Checkup & Issue Prescription
              </Button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              <h4 className="text-sm font-black flex items-center gap-2 mb-4 uppercase tracking-widest text-primary">
                <History className="h-4 w-4" /> Previous Visits ({history.length})
              </h4>
              {history.length > 0 ? (
                history.map((h: any) => (
                  <div key={h.id} className="p-5 glass border-border/20 rounded-2xl space-y-4 bg-background/20 group hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between border-b border-border/20 pb-3">
                      <div className="text-[11px] font-black text-primary uppercase tracking-widest">{format(new Date(h.scheduledAt), "MMM d, yyyy")}</div>
                      <div className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Dr. {h.doctor.user.name.split(' ').pop()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-black text-muted-foreground/60 mb-2 tracking-widest">Diagnosis/Notes</div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{h.clinicalNotes}"</p>
                    </div>
                    <div className="pt-2">
                      <div className="text-[9px] uppercase font-black text-primary/60 mb-2 flex items-center gap-1.5 tracking-widest">
                        <Pill className="h-3 w-3" /> Prescription
                      </div>
                      <p className="text-xs font-bold text-foreground/80 leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">{h.prescription}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-40">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-sm font-bold">No previous records</div>
                  <p className="text-xs mt-1">This patient has no completed appointments yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full md:w-80 space-y-4 shrink-0">
          <div className="p-6 glass border-border/20 rounded-3xl bg-background/30 shadow-xl">
            <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-5 border-b border-border/20 pb-2">Patient Profile</h4>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Blood Group</span>
                  <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{patient.bloodGroup || "N/A"}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Age</span>
                  <span className="font-bold">{patient.age ? `${patient.age} Years` : "Not provided"}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Gender</span>
                  <span className="font-bold uppercase tracking-widest">{patient.gender || "Not provided"}</span>
               </div>
               <div className="flex justify-between items-center text-xs pt-2 border-t border-border/20">
                  <span className="text-muted-foreground font-medium">Patient ID</span>
                  <span className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded">{patient.id.slice(-8).toUpperCase()}</span>
               </div>
            </div>
          </div>
          
          <div className="p-6 glass border-orange-500/20 rounded-3xl bg-orange-500/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity className="h-16 w-16" />
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-black text-orange-500 tracking-widest mb-4">
              <Activity className="h-4 w-4" />
              Primary Symptoms
            </div>
            <p className="text-xs leading-relaxed italic text-foreground/80 font-medium">
              "{appointment.symptoms || "Patient has not provided specific symptoms for this visit."}"
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
