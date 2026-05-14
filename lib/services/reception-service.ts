import { prisma } from "@/lib/db";
import { AppointmentStatus, QueueStatus } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export async function getReceptionStats() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  const [activeQueues, totalTokens, apptsRemaining, staffActive] = await Promise.all([
    // Active Queues: Doctors who have at least one WAITING or CALLED token today
    prisma.doctorProfile.count({
      where: {
        appointments: {
          some: {
            scheduledAt: { gte: start, lte: end },
            queueToken: {
              status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_PROGRESS] }
            }
          }
        }
      }
    }),
    // Total Tokens issued today
    prisma.queueToken.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    }),
    // Appointments Remaining: PENDING or CONFIRMED for today
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: start, lte: end },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
      }
    }),
    // Staff Active: Just a count of doctors for now as a placeholder for "Staff Active"
    prisma.doctorProfile.count({
      where: {
        user: { isActive: true }
      }
    })
  ]);

  return {
    activeQueues,
    totalTokens,
    apptsRemaining,
    staffActive
  };
}

export async function getRecentCheckIns(limit = 5) {
  return prisma.appointment.findMany({
    where: {
      status: { in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS] }
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      queueToken: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getQueueMovements() {
  // This could be from ActivityLog or just recent status changes
  return prisma.activityLog.findMany({
    where: {
      entityType: "QueueToken"
    },
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });
}

export async function getActiveDoctors() {
  return prisma.doctorProfile.findMany({
    where: {
      user: { isActive: true }
    },
    include: {
      user: true,
      departments: true
    }
  });
}

export async function getPendingCheckIns() {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  return prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      department: true,
    },
    orderBy: { scheduledAt: "asc" }
  });
}

export async function getFullQueue() {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  return prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      queueToken: { isNot: null }
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      queueToken: true,
    },
    orderBy: {
      queueToken: { position: "asc" }
    }
  });
}

export async function getDoctorsWithSchedules() {
  return prisma.doctorProfile.findMany({
    include: {
      user: true,
      schedules: {
        where: {
          startTime: { gte: new Date() }
        },
        include: {
          appointment: {
            include: {
              patient: {
                include: { user: true }
              }
            }
          }
        },
        orderBy: { startTime: "asc" }
      }
    }
  });
}
