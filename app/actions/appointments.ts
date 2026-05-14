"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { format } from "date-fns";

const bookingSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  departmentId: z.string().min(1, "Please select a department"),
  scheduledAt: z.string().min(1, "Please select a date and time"),
  symptoms: z.string().optional(),
});

export async function bookAppointment(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    
    // Fetch and verify patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { userId }
    });

    if (!patient) {
      return { success: false, error: "Only registered patients can book appointments." };
    }

    // Safe validation
    const rawData = {
      doctorId: formData.get("doctorId"),
      departmentId: formData.get("departmentId"),
      scheduledAt: formData.get("scheduledAt"),
      symptoms: formData.get("symptoms"),
    };

    const validated = bookingSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        success: false, 
        error: "Invalid data", 
        details: validated.error.flatten().fieldErrors 
      };
    }

    const { doctorId, departmentId, scheduledAt, symptoms } = validated.data;
    const slotId = formData.get("slotId") as string;

    // Concurrency Check: Ensure slot isn't already taken
    if (slotId) {
      const slot = await prisma.scheduleSlot.findUnique({
        where: { id: slotId }
      });
      if (!slot || slot.isBooked || !slot.isAvailable) {
        return { success: false, error: "This time slot is no longer available." };
      }
    } else {
      // Fallback for non-slot based booking (legacy or emergency)
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          scheduledAt: new Date(scheduledAt),
          status: { not: AppointmentStatus.CANCELLED }
        }
      });

      if (existingAppointment) {
        return { success: false, error: "This time slot is already booked. Please choose another time." };
      }
    }

    // Fetch a default hospital if none specified
    const hospital = await prisma.hospital.findFirst();
    if (!hospital) {
      return { success: false, error: "System configuration error: No hospital found." };
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        departmentId,
        hospitalId: hospital.id,
        scheduledAt: new Date(scheduledAt),
        scheduleSlotId: slotId || null,
        symptoms,
        status: AppointmentStatus.PENDING,
      }
    });

    // Mark slot as booked
    if (slotId) {
      await prisma.scheduleSlot.update({
        where: { id: slotId },
        data: { isBooked: true }
      });
    }

    // Notify Doctor
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { userId: true }
    });

    if (doctor) {
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: "New Appointment Request",
          message: `A new patient (${session.user.name}) has scheduled an appointment for ${format(new Date(scheduledAt), "p")}.`,
          type: "APPOINTMENT",
          link: "/doctor/dashboard"
        }
      });
    }

    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");
    revalidatePath("/patient/appointments");

    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    console.error("[BOOK_APPOINTMENT_ERROR]", error);
    return { success: false, error: "An unexpected error occurred. Please try again later." };
  }
}

export async function cancelAppointment(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { scheduleSlot: true }
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Security: Only patient can cancel their own appointment
    if (appointment.patientId !== patient?.id && (session.user as any).role === 'PATIENT') {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED }
    });

    // Release the slot if it was a scheduled slot
    if (appointment.scheduleSlotId) {
      await prisma.scheduleSlot.update({
        where: { id: appointment.scheduleSlotId },
        data: { isBooked: false }
      });
    }

    revalidatePath("/patient/appointments");
    revalidatePath("/patient/dashboard");
    revalidatePath("/doctor/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[CANCEL_APPOINTMENT_ERROR]", error);
    return { success: false, error: "Failed to cancel appointment" };
  }
}
