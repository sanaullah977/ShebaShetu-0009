"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const replySchema = z.object({
  ticketId: z.string().min(1),
  message: z.string().trim().min(2, "Reply must be at least 2 characters").max(2000),
});

const statusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

function isSupportHandler(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function replyToSupportTicket(data: z.infer<typeof replySchema>) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const senderId = (session?.user as any)?.id as string | undefined;

  if (!session?.user || !senderId || !isSupportHandler(role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = replySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid reply" };
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parsed.data.ticketId },
      select: {
        id: true,
        userId: true,
        user: { select: { role: true } },
      },
    });

    if (!ticket) return { success: false, error: "Ticket not found" };

    const duplicateWindow = new Date(Date.now() - 10_000);
    const duplicateReply = await prisma.supportTicketReply.findFirst({
      where: {
        ticketId: ticket.id,
        senderId,
        message: parsed.data.message,
        createdAt: { gte: duplicateWindow },
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (duplicateReply) {
      return {
        success: true,
        status: "IN_PROGRESS",
        updatedAt: duplicateReply.createdAt.toISOString(),
        reply: {
          id: duplicateReply.id,
          message: duplicateReply.message,
          createdAt: duplicateReply.createdAt.toISOString(),
          sender: duplicateReply.sender,
        },
      };
    }

    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId: ticket.id,
        senderId,
        message: parsed.data.message,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "IN_PROGRESS" },
      select: { status: true, updatedAt: true },
    });

    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "NEW_MESSAGE",
        title: "Support replied to your ticket",
        message: "Support replied to your ticket. Open Contact Support to read the reply.",
        link: `${getSupportPath(ticket.user.role)}?ticketId=${ticket.id}`,
      },
    });

    revalidatePath("/admin/support");
    revalidatePath("/patient/support");
    revalidatePath("/doctor/support");
    revalidatePath("/reception/support");

    return {
      success: true,
      status: updatedTicket.status,
      updatedAt: updatedTicket.updatedAt.toISOString(),
      reply: {
        id: reply.id,
        message: reply.message,
        createdAt: reply.createdAt.toISOString(),
        sender: reply.sender,
      },
    };
  } catch (error) {
    console.error("[SUPPORT_REPLY_ERROR]", error);
    return { success: false, error: "Failed to send reply" };
  }
}

function getSupportPath(role: string) {
  if (role === "DOCTOR") return "/doctor/support";
  if (role === "RECEPTION") return "/reception/support";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/support";
  return "/patient/support";
}

export async function updateSupportTicketStatus(data: z.infer<typeof statusSchema>) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;

  if (!session?.user || !isSupportHandler(role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid status update" };

  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: parsed.data.ticketId },
      data: { status: parsed.data.status },
      select: { id: true, status: true, updatedAt: true },
    });

    revalidatePath("/admin/support");
    revalidatePath("/patient/support");
    revalidatePath("/doctor/support");
    revalidatePath("/reception/support");

    return {
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        updatedAt: ticket.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to update ticket status" };
  }
}
