"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus, QueueStatus } from "@prisma/client";

export async function checkInPatient(appointmentId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "RECEPTION") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        queueToken: true,
        doctor: { include: { user: true } }
      }
    });

    if (!appointment) return { success: false, error: "Appointment not found" };
    if (appointment.queueToken) return { success: false, error: "Patient already checked in" };

    // Get latest position for the doctor today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastToken = await prisma.queueToken.findFirst({
      where: {
        appointment: {
          doctorId: appointment.doctorId,
          scheduledAt: { gte: today }
        }
      },
      orderBy: { position: "desc" }
    });

    const nextPosition = (lastToken?.position || 0) + 1;
    const tokenNumber = `${appointment.doctor.user.name?.charAt(0).toUpperCase() || 'D'}-${100 + nextPosition}`;

    const token = await prisma.queueToken.create({
      data: {
        appointmentId,
        tokenNumber,
        position: nextPosition,
        status: QueueStatus.WAITING
      }
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CHECKED_IN }
    });

    revalidatePath("/reception/queue");
    revalidatePath("/patient/live-queue");
    revalidatePath("/patient/dashboard");
    
    return { success: true, token };
  } catch (error) {
    console.error("Check-in error:", error);
    return { success: false, error: "Failed to check in patient" };
  }
}

export async function updateQueueStatus(tokenId: string, status: QueueStatus) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "RECEPTION") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId }
    });

    if (!token) return { success: false, error: "Token not found" };

    // Update token status
    await prisma.queueToken.update({
      where: { id: tokenId },
      data: { 
        status,
        ...(status === QueueStatus.CALLED ? { calledAt: new Date() } : {}),
        ...(status === QueueStatus.COMPLETED ? { completedAt: new Date() } : {})
      }
    });

    // Update linked appointment status if necessary
    let appointmentStatus: AppointmentStatus | null = null;
    if (status === QueueStatus.IN_PROGRESS) appointmentStatus = AppointmentStatus.IN_PROGRESS;
    if (status === QueueStatus.COMPLETED) appointmentStatus = AppointmentStatus.COMPLETED;
    if (status === QueueStatus.NO_SHOW) appointmentStatus = AppointmentStatus.NO_SHOW;

    if (appointmentStatus) {
      await prisma.appointment.update({
        where: { id: token.appointmentId },
        data: { status: appointmentStatus }
      });
    }

    revalidatePath("/reception/queue");
    revalidatePath("/patient/live-queue");
    revalidatePath("/patient/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update queue status error:", error);
    return { success: false, error: "Failed to update queue status" };
  }
}

export async function moveQueuePosition(tokenId: string, direction: "UP" | "DOWN") {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "RECEPTION") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const currentToken = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { appointment: true }
    });

    if (!currentToken) return { success: false, error: "Token not found" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the adjacent token to swap with (next highest or next lowest position)
    const adjacentToken = await prisma.queueToken.findFirst({
      where: {
        appointment: {
          doctorId: currentToken.appointment.doctorId,
          scheduledAt: { gte: today }
        },
        position: direction === "UP" ? { lt: currentToken.position } : { gt: currentToken.position },
        status: QueueStatus.WAITING
      },
      orderBy: {
        position: direction === "UP" ? "desc" : "asc"
      }
    });

    if (!adjacentToken) return { success: false, error: `Already at the ${direction === "UP" ? "top" : "bottom"} of the active queue` };

    // Swap positions
    await prisma.$transaction([
      prisma.queueToken.update({
        where: { id: currentToken.id },
        data: { position: adjacentToken.position }
      }),
      prisma.queueToken.update({
        where: { id: adjacentToken.id },
        data: { position: currentToken.position }
      })
    ]);

    revalidatePath("/reception/queue");
    revalidatePath("/patient/dashboard");
    revalidatePath("/patient/live-queue");
    return { success: true };
  } catch (error) {
    console.error("Move queue error:", error);
    return { success: false, error: "Failed to reorder queue" };
  }
}
