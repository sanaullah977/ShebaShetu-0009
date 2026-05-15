import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GlassCard } from "@/components/GlassCard";
import { LifeBuoy, Phone, Mail, MessageSquare } from "lucide-react";
import { SupportPanel } from "@/components/support/SupportPanel";

export default async function PatientSupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    include: {
      replies: {
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div>
        <div className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/80 mb-1">Help Center</div>
        <h1 className="text-4xl font-black tracking-tight">Support & Assistance</h1>
        <p className="text-sm text-muted-foreground/80 mt-1 max-w-2xl">
          Need help with your appointment? Encountered a technical issue? Our coordination desk is here to help you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
        <GlassCard className="md:col-span-2">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            What Happens Next
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your message is saved under your account only. Admin/support handlers can review it where support handling exists, and the team will contact you soon. Reception staff do not see private patient support tickets unless they have an authorized admin role.
          </p>
        </GlassCard>
      </div>

      <SupportPanel
        initialTickets={serializeTickets(tickets)}
        intro="Describe your appointment, profile, or system issue. You will see the ticket appear immediately below."
      />
    </div>
  );
}

function serializeTickets(tickets: Array<{
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  replies?: Array<{
    id: string;
    message: string;
    createdAt: Date;
    sender?: { name: string | null; role: string } | null;
  }>;
}>) {
  return tickets.map((ticket) => ({
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    replies: ticket.replies?.map((reply) => ({
      id: reply.id,
      message: reply.message,
      createdAt: reply.createdAt.toISOString(),
      sender: reply.sender,
    })) ?? [],
  }));
}
