"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const slotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  hospitalId: z.string(),
});

export async function createScheduleSlot(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "DOCTOR") {
    return { success: false, error: "Unauthorized" };
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: (session.user as any).id }
  });

  if (!doctor) return { success: false, error: "Doctor profile not found" };

  try {
    const data = {
      startTime: new Date(formData.get("startTime") as string),
      endTime: new Date(formData.get("endTime") as string),
      hospitalId: formData.get("hospitalId") as string,
      doctorId: doctor.id,
    };

    const slot = await prisma.scheduleSlot.create({ data });
    
    revalidatePath("/doctor/schedule");
    return { success: true, slot };
  } catch (error) {
    return { success: false, error: "Failed to create slot" };
  }
}

export async function toggleSlotAvailability(slotId: string, isAvailable: boolean) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
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
      include: { queueToken: true }
    });

    if (!appointment) return { success: false, error: "Appointment not found" };

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
      include: { queueToken: true }
    });

    if (!appointment) return { success: false, error: "Appointment not found" };

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
