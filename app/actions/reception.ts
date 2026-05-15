"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus, QueueStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

type ReceptionScope = {
  userId: string;
  hospitalId: string;
};

async function getReceptionScope(): Promise<{ scope?: ReceptionScope; error?: string }> {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!session?.user || !userId || role !== "RECEPTION") {
    return { error: "Unauthorized" };
  }

  const profile = await prisma.receptionProfile.findUnique({
    where: { userId },
    select: { hospitalId: true },
  });

  if (!profile?.hospitalId) {
    return { error: "Receptionist hospital assignment required" };
  }

  return { scope: { userId, hospitalId: profile.hospitalId } };
}

function appointmentStatusForQueue(status: QueueStatus) {
  if (status === QueueStatus.IN_PROGRESS) return AppointmentStatus.IN_PROGRESS;
  if (status === QueueStatus.COMPLETED) return AppointmentStatus.COMPLETED;
  if (status === QueueStatus.CANCELLED) return AppointmentStatus.CANCELLED;
  if (status === QueueStatus.NO_SHOW) return AppointmentStatus.NO_SHOW;
  return AppointmentStatus.CHECKED_IN;
}

async function getQueuePayload(hospitalId: string) {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const queue = await prisma.appointment.findMany({
    where: {
      hospitalId,
      scheduledAt: { gte: start, lte: end },
      queueToken: { isNot: null },
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      department: true,
      queueToken: true,
    },
    orderBy: {
      queueToken: { position: "asc" },
    },
  });

  return JSON.parse(JSON.stringify(queue));
}

async function getPendingPayload(hospitalId: string) {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const pending = await prisma.appointment.findMany({
    where: {
      hospitalId,
      scheduledAt: { gte: start, lte: end },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      department: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return JSON.parse(JSON.stringify(pending));
}

function revalidateReceptionQueue() {
  revalidatePath("/reception/dashboard");
  revalidatePath("/reception/queue");
  revalidatePath("/patient/live-queue");
}

export async function checkInPatient(appointmentId: string) {
  const { scope, error } = await getReceptionScope();
  if (!scope) return { success: false, error };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, queueToken: true },
      });

      if (!appointment) return { success: false as const, error: "Appointment not found" };
      if (appointment.hospitalId !== scope.hospitalId) {
        return { success: false as const, error: "Appointment is outside your assigned hospital" };
      }
      if (appointment.queueToken) return { success: false as const, error: "Patient already checked in" };
      if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.CONFIRMED) {
        return { success: false as const, error: "Only pending or confirmed appointments can be checked in" };
      }

      const start = startOfDay(appointment.scheduledAt);
      const end = endOfDay(appointment.scheduledAt);
      const count = await tx.queueToken.count({
        where: {
          appointment: {
            doctorId: appointment.doctorId,
            hospitalId: scope.hospitalId,
            scheduledAt: { gte: start, lte: end },
          },
        },
      });

      const tokenNumber = `${appointment.doctor.specialization[0]?.toUpperCase() || "Q"}-${count + 1}`;
      const token = await tx.queueToken.create({
        data: {
          appointmentId,
          tokenNumber,
          position: count + 1,
          status: QueueStatus.WAITING,
        },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CHECKED_IN },
      });

      await tx.activityLog.create({
        data: {
          userId: scope.userId,
          action: "CHECK_IN",
          entityId: token.id,
          entityType: "QueueToken",
          details: `Patient checked in. Token: ${tokenNumber}`,
        },
      });

      return { success: true as const, tokenNumber };
    });

    if (!result.success) return result;

    revalidateReceptionQueue();
    return {
      success: true,
      tokenNumber: result.tokenNumber,
      queue: await getQueuePayload(scope.hospitalId),
      pendingAppointments: await getPendingPayload(scope.hospitalId),
    };
  } catch (error) {
    console.error("Check-in error:", error);
    return { success: false, error: "Failed to check in patient" };
  }
}

export async function updateQueueStatus(tokenId: string, status: QueueStatus) {
  const { scope, error } = await getReceptionScope();
  if (!scope) return { success: false, error };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.queueToken.findUnique({
        where: { id: tokenId },
        include: { appointment: { select: { id: true, hospitalId: true } } },
      });

      if (!token) return { success: false as const, error: "Queue token not found" };
      if (token.appointment.hospitalId !== scope.hospitalId) {
        return { success: false as const, error: "Queue token is outside your assigned hospital" };
      }

      const now = new Date();
      await tx.queueToken.update({
        where: { id: tokenId },
        data: {
          status,
          calledAt: status === QueueStatus.CALLED ? now : status === QueueStatus.WAITING ? null : undefined,
          completedAt: status === QueueStatus.COMPLETED ? now : undefined,
        },
      });

      await tx.appointment.update({
        where: { id: token.appointment.id },
        data: { status: appointmentStatusForQueue(status) },
      });

      await tx.activityLog.create({
        data: {
          userId: scope.userId,
          action: `QUEUE_${status}`,
          entityId: tokenId,
          entityType: "QueueToken",
          details: `Queue token status changed to ${status}`,
        },
      });

      return { success: true as const };
    });

    if (!result.success) return result;

    revalidateReceptionQueue();
    return { success: true, queue: await getQueuePayload(scope.hospitalId) };
  } catch (error) {
    console.error("Update queue status error:", error);
    return { success: false, error: "Failed to update queue status" };
  }
}

export async function callNextPatient() {
  const { scope, error } = await getReceptionScope();
  if (!scope) return { success: false, error };

  try {
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.queueToken.findFirst({
        where: {
          status: QueueStatus.WAITING,
          appointment: {
            hospitalId: scope.hospitalId,
            scheduledAt: { gte: start, lte: end },
          },
        },
        include: { appointment: { select: { id: true } } },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });

      if (!token) return { success: false as const, error: "No waiting patient found" };

      await tx.queueToken.update({
        where: { id: token.id },
        data: { status: QueueStatus.CALLED, calledAt: new Date() },
      });
      await tx.appointment.update({
        where: { id: token.appointment.id },
        data: { status: AppointmentStatus.CHECKED_IN },
      });
      await tx.activityLog.create({
        data: {
          userId: scope.userId,
          action: "CALL_NEXT",
          entityId: token.id,
          entityType: "QueueToken",
          details: `Called next patient. Token: ${token.tokenNumber}`,
        },
      });

      return { success: true as const, tokenNumber: token.tokenNumber };
    });

    if (!result.success) return result;

    revalidateReceptionQueue();
    return {
      success: true,
      tokenNumber: result.tokenNumber,
      queue: await getQueuePayload(scope.hospitalId),
    };
  } catch (error) {
    return { success: false, error: "Failed to call next patient" };
  }
}

export async function markNoShow(tokenId: string) {
  return updateQueueStatus(tokenId, QueueStatus.NO_SHOW);
}

export async function moveQueuePosition(tokenId: string, direction: "UP" | "DOWN") {
  const { scope, error } = await getReceptionScope();
  if (!scope) return { success: false, error };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.queueToken.findUnique({
        where: { id: tokenId },
        include: {
          appointment: {
            select: {
              hospitalId: true,
              doctorId: true,
              scheduledAt: true,
            },
          },
        },
      });

      if (!token) return { success: false as const, error: "Queue token not found" };
      if (token.appointment.hospitalId !== scope.hospitalId) {
        return { success: false as const, error: "Queue token is outside your assigned hospital" };
      }
      if (token.status !== QueueStatus.WAITING) {
        return { success: false as const, error: "Only waiting tokens can be moved" };
      }

      const start = startOfDay(token.appointment.scheduledAt);
      const end = endOfDay(token.appointment.scheduledAt);
      const swapToken = await tx.queueToken.findFirst({
        where: {
          id: { not: token.id },
          status: QueueStatus.WAITING,
          position: direction === "UP" ? { lt: token.position } : { gt: token.position },
          appointment: {
            hospitalId: scope.hospitalId,
            doctorId: token.appointment.doctorId,
            scheduledAt: { gte: start, lte: end },
          },
        },
        orderBy: { position: direction === "UP" ? "desc" : "asc" },
      });

      if (!swapToken) {
        return {
          success: false as const,
          error: direction === "UP" ? "Token is already first" : "Token is already last",
        };
      }

      await Promise.all([
        tx.queueToken.update({
          where: { id: token.id },
          data: { position: swapToken.position },
        }),
        tx.queueToken.update({
          where: { id: swapToken.id },
          data: { position: token.position },
        }),
      ]);

      await tx.activityLog.create({
        data: {
          userId: scope.userId,
          action: `MOVE_${direction}`,
          entityId: token.id,
          entityType: "QueueToken",
          details: `Moved token ${direction.toLowerCase()} in queue`,
        },
      });

      return { success: true as const };
    });

    if (!result.success) return result;

    revalidateReceptionQueue();
    return { success: true, queue: await getQueuePayload(scope.hospitalId) };
  } catch (error) {
    return { success: false, error: "Failed to move queue position" };
  }
}
