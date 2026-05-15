"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const slotSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  hospitalId: z.string().min(1, "Hospital is required"),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  path: ["endTime"],
  message: "End time must be after start time",
});

export async function createScheduleSlot(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "DOCTOR") {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: {
      departments: {
        select: {
          hospitalId: true,
        }
      }
    }
  });

  if (!doctor) return { success: false, error: "Doctor profile not found" };
  const parsed = slotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    hospitalId: formData.get("hospitalId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid schedule slot" };
  }

  const assignedHospitalIds = new Set(doctor.departments.map((department) => department.hospitalId).filter(Boolean));
  if (!assignedHospitalIds.has(parsed.data.hospitalId)) {
    return { success: false, error: "You can only create slots for assigned hospitals." };
  }

  try {
    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    const overlappingSlot = await prisma.scheduleSlot.findFirst({
      where: {
        doctorId: doctor.id,
        hospitalId: parsed.data.hospitalId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      }
    });

    if (overlappingSlot) {
      return { success: false, error: "This slot overlaps an existing schedule slot." };
    }

    const data = {
      startTime,
      endTime,
      hospitalId: parsed.data.hospitalId,
      doctorId: doctor.id,
    };

    const slot = await prisma.scheduleSlot.create({
      data,
      include: {
        hospital: { select: { id: true, name: true } },
      }
    });
    
    revalidatePath("/doctor/schedule");
    return { success: true, slot: serializeSlot(slot) };
  } catch (error) {
    return { success: false, error: "Failed to create slot" };
  }
}

export async function toggleSlotAvailability(slotId: string, isAvailable: boolean) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: slotId },
      include: { doctor: { select: { userId: true } } }
    });

    if (!slot) return { success: false, error: "Slot not found" };
    if (slot.doctor.userId !== (session.user as any).id) {
      return { success: false, error: "Unauthorized access to slot" };
    }

    await prisma.scheduleSlot.update({
      where: { id: slotId },
      data: { isAvailable }
    });
    revalidatePath("/doctor/schedule");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update slot" };
  }
}

export async function startAppointment(appointmentId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true, doctor: { select: { userId: true } } }
    });

    if (!appointment) return { success: false, error: "Appointment not found" };
    if ((session.user as any).role === "DOCTOR" && appointment.doctor.userId !== (session.user as any).id) {
      return { success: false, error: "Unauthorized access to appointment" };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: "IN_PROGRESS",
        ...(appointment.queueToken ? {
          queueToken: {
            update: {
              status: "IN_PROGRESS",
              calledAt: new Date()
            }
          }
        } : {})
      }
    });
    
    revalidatePath("/doctor/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to start session" };
  }
}

export async function completeAppointment(appointmentId: string, clinicalNotes: string, prescription: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true, doctor: { select: { userId: true } } }
    });

    if (!appointment) return { success: false, error: "Appointment not found" };
    if ((session.user as any).role === "DOCTOR" && appointment.doctor.userId !== (session.user as any).id) {
      return { success: false, error: "Unauthorized access to appointment" };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        clinicalNotes,
        prescription,
        ...(appointment.queueToken ? {
          queueToken: {
            update: {
              status: "COMPLETED",
              completedAt: new Date()
            }
          }
        } : {})
      }
    });

    revalidatePath("/doctor/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to complete session" };
  }
}

export async function getPatientReportsForDoctor(patientId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "DOCTOR") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true },
    });

    if (!doctor) return { success: false, error: "Doctor profile not found" };

    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        patientId,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });

    if (!activeAppointment) {
      return { success: false, error: "Reports are only available for the active patient session" };
    }

    const reports = await prisma.report.findMany({
      where: { patientId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        uploadedAt: true,
      },
    });

    return {
      success: true,
      reports: reports.map((report) => ({
        ...report,
        uploadedAt: report.uploadedAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false, error: "Failed to load reports" };
  }
}

function serializeSlot(slot: {
  id: string;
  hospitalId: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isBooked: boolean;
  hospital?: { id: string; name: string } | null;
}) {
  return {
    id: slot.id,
    hospitalId: slot.hospitalId,
    doctorId: slot.doctorId,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    isAvailable: slot.isAvailable,
    isBooked: slot.isBooked,
    hospital: slot.hospital ?? null,
  };
}

export async function deleteScheduleSlot(slotId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "DOCTOR") {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;

  try {
    // Ensure the slot belongs to the logged-in doctor
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: slotId },
      include: { doctor: true }
    });

    if (!slot) return { success: false, error: "Slot not found" };
    if (slot.doctor.userId !== userId) return { success: false, error: "Unauthorized access to slot" };
    if (slot.isBooked) return { success: false, error: "Cannot delete a booked slot" };

    await prisma.scheduleSlot.delete({
      where: { id: slotId }
    });

    revalidatePath("/doctor/schedule");
    return { success: true };
  } catch (error) {
    console.error("Delete slot error:", error);
    return { success: false, error: "Failed to delete slot" };
  }
}

export async function getPatientReportsForDoctor(patientId: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "DOCTOR") {
    return { success: false, error: "Unauthorized" };
  }

  const doctorUserId = (session.user as any).id;

  try {
    // SECURITY: Ensure this doctor has an active or past appointment with this patient
    const hasAccess = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctor: { userId: doctorUserId },
      }
    });

    if (!hasAccess) {
      return { success: false, error: "Unauthorized access to patient reports" };
    }

    const reports = await prisma.report.findMany({
      where: { patientId },
      orderBy: { uploadedAt: "desc" }
    });

    return { success: true, reports };
  } catch (error) {
    console.error("Get patient reports error:", error);
    return { success: false, error: "Failed to fetch reports" };
  }
}
