import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SupportPanel } from "@/components/support/SupportPanel";

export default async function SupportPage() {
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get in touch with the hospital coordination desk or report a system issue.
        </p>
      </div>

      <SupportPanel
        initialTickets={serializeTickets(tickets)}
        intro="Share clinical workflow, schedule, or patient coordination issues with the support team."
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
