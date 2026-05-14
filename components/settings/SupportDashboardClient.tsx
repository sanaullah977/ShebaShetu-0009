"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { LifeBuoy, Send, MessageSquare, History, Phone, Mail, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupportTicket } from "@/app/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}

export function SupportDashboardClient({ initialTickets, role }: { initialTickets: Ticket[], role: "PATIENT" | "DOCTOR" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    const res = await createSupportTicket(subject, message);
    setLoading(false);

    if (res.success && res.ticket) {
      toast.success("Support ticket submitted successfully!");
      setTickets([res.ticket as Ticket, ...tickets]);
      setSuccessMsg("Your message has been submitted. The support team will contact you soon.");
      (e.target as HTMLFormElement).reset();
      router.refresh();
      
      setTimeout(() => setSuccessMsg(""), 10000); // Clear after 10s
    } else {
      toast.error(res.error || "Failed to submit ticket");
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        {role === "PATIENT" && (
          <GlassCard className="bg-primary/5 border-primary/10">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Emergency Contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background grid place-items-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Hotline</div>
                  <div className="text-sm font-black">+880 1234 567890</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background grid place-items-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Email</div>
                  <div className="text-sm font-black">support@shebashetu.com</div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard>
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
             <MessageSquare className="h-5 w-5 text-primary" />
             New Support Ticket
           </h3>
           <form onSubmit={handleSubmit} className="space-y-4">
             {successMsg && (
               <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold leading-relaxed">
                 {successMsg}
               </div>
             )}
             <div className="space-y-1.5">
               <label className="text-[11px] font-medium text-muted-foreground uppercase">Subject</label>
               <input 
                 name="subject" 
                 placeholder="Brief summary of issue"
                 className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                 required
               />
             </div>
             <div className="space-y-1.5">
               <label className="text-[11px] font-medium text-muted-foreground uppercase">Message</label>
               <textarea 
                 name="message" 
                 rows={4}
                 placeholder="Describe your request in detail..."
                 className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                 required
               />
             </div>
             <Button disabled={loading} type="submit" className="w-full bg-primary text-primary-foreground shadow-glow h-12 font-bold rounded-xl active:scale-[0.98] transition-transform">
               {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
               Submit Ticket
             </Button>
           </form>
        </GlassCard>
      </div>

      <div className="lg:col-span-2">
        <GlassCard className="h-full">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Your Recent Tickets
          </h3>
          
          <div className="space-y-4">
            {tickets.length > 0 ? (
              tickets.map((t) => (
                <div key={t.id} className="glass border-border/40 rounded-2xl p-5 flex flex-col gap-3 hover:bg-primary/[0.02] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black group-hover:text-primary transition-colors">{t.subject}</div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      t.status === "OPEN" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                    )}>
                      {t.status}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{t.message}</p>
                  <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5 pt-1">
                    <Clock className="h-3 w-3" /> Submitted {format(new Date(t.createdAt), "PPP")}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center glass rounded-3xl border-dashed border-2 border-border/60 opacity-40">
                <LifeBuoy className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-tight">No active tickets</p>
                <p className="text-xs mt-1">If you submit a ticket, it will appear here.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
