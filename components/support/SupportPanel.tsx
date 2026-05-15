"use client"

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { History, LifeBuoy, Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { createSupportTicket } from "@/app/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type SupportTicketView = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt?: string;
  pending?: boolean;
  replies?: Array<{
    id: string;
    message: string;
    createdAt: string;
    sender?: { name: string | null; role?: string | null } | null;
  }>;
};

interface SupportPanelProps {
  initialTickets: SupportTicketView[];
  intro?: string;
}

export function SupportPanel({ initialTickets, intro }: SupportPanelProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (trimmedSubject.length < 3 || trimmedMessage.length < 10) {
      toast.error("Please add a clear subject and at least 10 characters of detail.");
      return;
    }

    const tempTicket: SupportTicketView = {
      id: `pending-${Date.now()}`,
      subject: trimmedSubject,
      message: trimmedMessage,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setTickets((current) => [tempTicket, ...current]);
    setSubject("");
    setMessage("");

    startTransition(async () => {
      const result = await createSupportTicket(trimmedSubject, trimmedMessage);
      if (result.success && result.ticket) {
        setTickets((current) => current.map((ticket) => ticket.id === tempTicket.id ? result.ticket : ticket));
        toast.success("Your message has been submitted. The support team will contact you soon.");
      } else {
        setTickets((current) => current.filter((ticket) => ticket.id !== tempTicket.id));
        setSubject(trimmedSubject);
        setMessage(trimmedMessage);
        toast.error(result.error || "Failed to submit ticket");
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <GlassCard className="lg:col-span-1 h-fit">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          New Ticket
        </h3>
        {intro && <p className="text-xs text-muted-foreground leading-relaxed mb-4">{intro}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Brief summary of issue"
              className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">Message</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Describe your request in detail..."
              className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              required
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full bg-primary text-primary-foreground shadow-glow">
            {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Ticket
          </Button>
        </form>
        <div className="mt-4 rounded-xl bg-primary/5 border border-primary/10 p-3 text-[11px] text-muted-foreground leading-relaxed">
          Your message is routed to admin/support handlers when available. Receptionists do not see private support tickets unless explicitly given an admin role.
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Ticket History
        </h3>

        <div className="space-y-3">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.id} className={cn("glass rounded-xl p-4 flex flex-col gap-2", ticket.pending && "opacity-70")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold">{ticket.subject}</div>
                  <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold uppercase tracking-wider text-primary">
                    {ticket.pending ? "Submitting" : ticket.status}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-3">{ticket.message}</p>
                {ticket.replies && ticket.replies.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-border/30 pt-2">
                    {ticket.replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg bg-primary/5 border border-primary/10 p-2">
                        <div className="text-[9px] uppercase font-black tracking-widest text-primary">
                          {reply.sender?.name || "Support Team"} {reply.sender?.role ? `- ${reply.sender.role}` : ""}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[9px] text-muted-foreground/60 mt-1">
                  Submitted on {format(new Date(ticket.createdAt), "PPP")}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-40">
              <LifeBuoy className="h-10 w-10 mx-auto mb-3" />
              <p className="text-sm">No support tickets found.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
