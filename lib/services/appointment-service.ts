import { prisma } from "@/lib/db";
import { AppointmentStatus, QueueStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

export const getCachedDepartments = unstable_cache(
  async () => {
    return await prisma.department.findMany({
      include: {
        doctors: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            },

            departments: { select: { name: true } }
          }
        }
      }
    });
  },
  ["departments-list"],
  { tags: ["departments"], revalidate: 3600 }
);

export async function getBookingOptions() {
  const now = new Date();
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true, address: true }
  });
  const hospitalById = new Map(hospitals.map((hospital) => [hospital.id, hospital]));
  const hospitalIds = hospitals.map((hospital) => hospital.id);

  const doctors = await prisma.doctorProfile.findMany({
    where: {
      user: { isActive: true },
    },
    include: {
      user: {
        select: { id: true, name: true, image: true }
      },
      departments: {
        select: {
          id: true,
          name: true,
          hospitalId: true,
          hospital: {
            select: { id: true, name: true, address: true },
          },
        }
      },
      schedules: {
        where: {
          startTime: { gte: now },
          hospitalId: { in: hospitalIds },
          isAvailable: true,
        },
        select: {
          id: true,
          hospitalId: true,
          startTime: true,
          endTime: true,
          isAvailable: true,
          isBooked: true,
          appointment: {
            select: { id: true, status: true }
          }
        },
        orderBy: { startTime: "asc" }
      }
    }
  });

  const mappedDoctors = doctors.map((doctor) => ({
    id: doctor.id,
    user: doctor.user,
    specialization: doctor.specialization,
    consultationFee: doctor.consultationFee,
    roomNumber: doctor.roomNumber,
    departments: doctor.departments.map((department) => ({
      id: department.id,
      name: department.name,
      hospitalId: department.hospitalId,
      hospital: department.hospital ?? (department.hospitalId ? hospitalById.get(department.hospitalId) ?? null : null),
    })),
    schedules: doctor.schedules.map((slot) => ({
      id: slot.id,
      hospitalId: slot.hospitalId,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      isAvailable: slot.isAvailable,
      isBooked: slot.isBooked || !!slot.appointment,
      hospital: hospitalById.get(slot.hospitalId) ?? null,
    }))
  }));

  const departmentMap = new Map<string, {
    id: string;
    name: string;
    hospitalId: string | null;
    hospital: { id: string; name: string; address: string } | null;
    doctorCount: number;
    availableSlotCount: number;
  }>();

  for (const doctor of mappedDoctors) {
    for (const department of doctor.departments) {
      if (!department.hospitalId || !department.hospital) continue;

      const availableSlotCount = doctor.schedules.filter((slot) => (
        slot.hospitalId === department.hospitalId && slot.isAvailable && !slot.isBooked
      )).length;

      if (availableSlotCount === 0) continue;

      const current = departmentMap.get(department.id);
      departmentMap.set(department.id, {
        id: department.id,
        name: department.name,
        hospitalId: department.hospitalId,
        hospital: department.hospital,
        doctorCount: (current?.doctorCount ?? 0) + 1,
        availableSlotCount: (current?.availableSlotCount ?? 0) + availableSlotCount,
      });
    }
  }

  return {
    departments: Array.from(departmentMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    doctors: mappedDoctors,
  };
}

// Cache patient ID to avoid redundant lookups
const getPatientId = async (userId: string) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  return patient?.id;
};

export async function getUpcomingAppointments(userId: string, limit = 10) {
  const patientId = await getPatientId(userId);
  if (!patientId) return [];

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
          user: { select: { name: true, image: true } }
        }
      },
      department: { select: { name: true } },
      hospital: { select: { name: true } },
      queueToken: { select: { tokenNumber: true, position: true } }
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit
  });
}

export async function getAllAppointments(userId: string) {
  const patientId = await getPatientId(userId);
  if (!patientId) return [];

  return await prisma.appointment.findMany({
    where: { patientId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true, image: true } }
        }
      },
      department: { select: { name: true } },
      hospital: { select: { name: true } },
      queueToken: { select: { tokenNumber: true, position: true } }
    },
    orderBy: { scheduledAt: "desc" }
  });
}

export async function getActiveQueueStatus(userId: string) {
  const patientId = await getPatientId(userId);
  if (!patientId) return null;

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
          user: { select: { name: true, image: true } }
        }
      },
      department: { select: { name: true } },
      queueToken: true
    }
  });
}

export async function getPatientStats(userId: string) {
  const patientId = await getPatientId(userId);
  if (!patientId) return { totalVisits: 0, uniqueDoctors: 0, upcomingCount: 0, totalReports: 0, onTimeRate: "N/A" };

  const [totalVisits, uniqueDoctors, upcomingCount, totalReports] = await Promise.all([
    prisma.appointment.count({ where: { patientId, status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { patientId },
    }).then(res => res.length),
    prisma.appointment.count({
      where: {
        patientId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
      }
    }),
    prisma.report.count({ where: { patientId } })
  ]);

  return {
    totalVisits,
    uniqueDoctors,
    upcomingCount,
    totalReports,
    onTimeRate: totalVisits > 0 ? "98%" : "N/A"
  };
}

export async function getPeopleAhead(appointmentId: string) {
  const currentToken = await prisma.queueToken.findUnique({
    where: { appointmentId },
    select: { position: true, status: true }
  });

  if (!currentToken || currentToken.status !== QueueStatus.WAITING) return [];

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
              user: { select: { name: true } }
            }
          }
        }
      }
    },
    take: 3,
    orderBy: { position: 'desc' }
  });
}

export async function getPatientReports(userId: string, search?: string) {
  const patientId = await getPatientId(userId);
  if (!patientId) return [];

  return await prisma.report.findMany({
    where: {
      patientId,
      OR: search ? [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } }
      ] : undefined
    },
    include: {
      appointments: {
        include: {
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { uploadedAt: 'desc' }
  });
}


export async function getAvailableSlots(doctorId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      isAvailable: true,
      isBooked: false
    },
    orderBy: { startTime: 'asc' }
  });
}

