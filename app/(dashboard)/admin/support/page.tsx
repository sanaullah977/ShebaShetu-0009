import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminSupportPanel } from "@/components/support/AdminSupportPanel";

export default async function AdminSupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/unauthorized");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      replies: {
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <div className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/80 mb-1">Support Desk</div>
        <h1 className="text-4xl font-black tracking-tight">Support Tickets</h1>
        <p className="text-sm text-muted-foreground/80 mt-1 max-w-2xl">
          Review user tickets, reply to requests, and keep ticket status current.
        </p>
      </div>

      <AdminSupportPanel initialTickets={serializeTickets(tickets)} />
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
  user: { id: string; name: string | null; email: string | null; role: string };
  replies: Array<{
    id: string;
    message: string;
    createdAt: Date;
    sender: { id: string; name: string | null; role: string };
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
    user: ticket.user,
    replies: ticket.replies.map((reply) => ({
      id: reply.id,
      message: reply.message,
      createdAt: reply.createdAt.toISOString(),
      sender: reply.sender,
    })),
  }));
}
