import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GlassCard } from "@/components/GlassCard";
import { LifeBuoy, Send, MessageSquare, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupportTicket } from "@/app/actions/settings";
import { format } from "date-fns";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get in touch with the hospital coordination desk or report a system issue.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1 h-fit">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            New Ticket
          </h3>
          <form action={async (formData: FormData) => {
            "use server"
            const subject = formData.get("subject") as string;
            const message = formData.get("message") as string;
            await createSupportTicket(subject, message);
          }} className="space-y-4">
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
            <Button type="submit" className="w-full bg-primary text-primary-foreground shadow-glow">
              <Send className="h-4 w-4 mr-2" />
              Submit Ticket
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Ticket History
          </h3>
          
          <div className="space-y-3">
            {tickets.length > 0 ? (
              tickets.map((t) => (
                <div key={t.id} className="glass rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">{t.subject}</div>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold uppercase tracking-wider text-primary">
                      {t.status}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{t.message}</p>
                  <div className="text-[9px] text-muted-foreground/60 mt-1">
                    Submitted on {format(new Date(t.createdAt), "PPP")}
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
    </div>
  );
}
