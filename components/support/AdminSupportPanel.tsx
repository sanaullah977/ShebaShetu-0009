"use client"

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { History, Loader2, MessageSquare, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { replyToSupportTicket, updateSupportTicketStatus } from "@/app/actions/support";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AdminSupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string | null; role: string };
  replies: Array<{
    id: string;
    message: string;
    createdAt: string;
    sender: { id: string; name: string | null; role: string };
  }>;
};

const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export function AdminSupportPanel({ initialTickets }: { initialTickets: AdminSupportTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState(initialTickets[0]?.id || "");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredTickets = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      const haystack = [
        ticket.subject,
        ticket.message,
        ticket.user.name,
        ticket.user.email,
        ticket.user.role,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [tickets, search, statusFilter]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || filteredTickets[0];

  const handleStatus = (status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    if (!selectedTicket || isPending) return;
    startTransition(async () => {
      const result = await updateSupportTicketStatus({ ticketId: selectedTicket.id, status });
      if (result.success && result.ticket) {
        setTickets((current) => current.map((ticket) => (
          ticket.id === selectedTicket.id
            ? { ...ticket, status: result.ticket.status, updatedAt: result.ticket.updatedAt }
            : ticket
        )));
        toast.success("Ticket status updated");
      } else {
        toast.error(result.error || "Failed to update ticket");
      }
    });
  };

  const handleReply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicket || isPending) return;
    const message = reply.trim();
    if (message.length < 2) {
      toast.error("Reply must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const result = await replyToSupportTicket({ ticketId: selectedTicket.id, message });
      if (result.success && result.reply) {
        setTickets((current) => current.map((ticket) => (
          ticket.id === selectedTicket.id
            ? {
                ...ticket,
                status: result.status || ticket.status,
                updatedAt: result.updatedAt || ticket.updatedAt,
                replies: [...ticket.replies, result.reply],
              }
            : ticket
        )));
        setReply("");
        toast.success("Reply sent");
      } else {
        toast.error(result.error || "Failed to send reply");
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-6">
      <GlassCard className="h-fit">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Tickets
          </h3>
          <div className="text-[10px] text-muted-foreground font-black uppercase">{tickets.length} total</div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requester or subject..."
            className="w-full glass rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                statusFilter === status ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
              )}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1">
          {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelectedId(ticket.id)}
              className={cn(
                "w-full text-left rounded-xl border p-3 transition-colors",
                selectedTicket?.id === ticket.id ? "border-primary/40 bg-primary/10" : "glass border-border/40 hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold line-clamp-1">{ticket.subject}</div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {ticket.user.name || ticket.user.email || "Unknown"} - {ticket.user.role}
              </div>
            </button>
          )) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No tickets found.</div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        {selectedTicket ? (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ticket Details</div>
                <h3 className="text-2xl font-black tracking-tight mt-1">{selectedTicket.subject}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTicket.user.name || "Unknown"} - {selectedTicket.user.email || "No email"} - {selectedTicket.user.role}
                </p>
              </div>
              <StatusBadge status={selectedTicket.status} />
            </div>

            <div className="rounded-xl bg-background/40 border border-border/40 p-4 text-sm text-muted-foreground leading-relaxed">
              {selectedTicket.message}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={selectedTicket.status === status ? "default" : "outline"}
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleStatus(status)}
                  className="text-[10px] font-black uppercase tracking-widest"
                >
                  {status.replace("_", " ")}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Replies</div>
              {selectedTicket.replies.length > 0 ? (
                selectedTicket.replies.map((item) => (
                  <div key={item.id} className="rounded-xl glass p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {item.sender.name || "Support Team"} - {item.sender.role}
                      </div>
                      <div className="text-[9px] text-muted-foreground">{format(new Date(item.createdAt), "MMM d, h:mm a")}</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{item.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                  No replies yet.
                </div>
              )}
            </div>

            <form onSubmit={handleReply} className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reply</label>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={4}
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                placeholder="Write a support reply..."
              />
              <Button type="submit" disabled={isPending || reply.trim().length < 2} className="bg-primary text-primary-foreground shadow-glow">
                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send Reply
              </Button>
            </form>
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Select a ticket to review.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
      {status.replace("_", " ")}
    </span>
  );
}
