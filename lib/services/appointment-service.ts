import { prisma } from "@/lib/db";
import { AppointmentStatus, QueueStatus } from "@prisma/client";

export async function getUpcomingAppointments(patientId: string) {
  return await prisma.appointment.findMany({
    where: {
      patientId,
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN]
      }
    },
    include: {
      doctor: {
        include: {
          user: true
        }
      },
      department: true,
      queueToken: true
    },
    orderBy: {
      scheduledAt: 'asc'
    }
  });
}

export async function getActiveQueueStatus(patientId: string) {
  // Find the most relevant active appointment (Checked-in or In-progress)
  return await prisma.appointment.findFirst({
    where: {
      patientId,
      status: {
        in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS]
      }
    },
    include: {
      doctor: {
        include: {
          user: true
        }
      },
      department: true,
      queueToken: true
    }
  });
}

export async function getPatientStats(patientId: string) {
  const [totalVisits, uniqueDoctors, upcomingCount] = await Promise.all([
    prisma.appointment.count({ where: { patientId, status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { patientId },
      _count: true
    }).then(res => res.length),
    prisma.appointment.count({
      where: {
        patientId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
      }
    })
  ]);

  return {
    totalVisits,
    uniqueDoctors,
    upcomingCount,
    onTimeRate: "98%" // Placeholder for now
  };
}

export async function getPeopleAhead(appointmentId: string) {
  const currentToken = await prisma.queueToken.findUnique({
    where: { appointmentId }
  });

  if (!currentToken) return [];

  return await prisma.queueToken.findMany({
    where: {
      status: QueueStatus.WAITING,
      position: { lt: currentToken.position }
    },
    include: {
      appointment: {
        include: {
          patient: {
            include: {
              user: true
            }
          }
        }
      }
    },
    take: 3,
    orderBy: {
      position: 'desc'
    }
  });
}
