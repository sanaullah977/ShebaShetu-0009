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
  scheduleSlotId: z.string().min(1, "Please select an available slot"),
  symptoms: z.string().optional(),
});

export async function bookAppointment(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role as string | undefined;
    if (role !== "PATIENT") {
      return { success: false, error: "Only patients can book appointments." };
    }

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
      scheduleSlotId: formData.get("scheduleSlotId"),
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

    const { doctorId, departmentId, scheduleSlotId, symptoms } = validated.data;

    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: scheduleSlotId },
      include: {
        doctor: {
          include: {
            departments: { select: { id: true, hospitalId: true, name: true } },
          }
        },
      }
    });

    if (!slot) {
      return { success: false, error: "Selected slot not found." };
    }
    if (!slot || !slot.isAvailable || slot.isBooked) {
      return { success: false, error: "This slot is no longer available. Please choose another time." };
    }

    if (slot.doctorId !== doctorId) {
      return { success: false, error: "Selected slot does not belong to this doctor." };
    }

    const selectedDepartment = slot.doctor.departments.find((department) => department.id === departmentId);
    if (!selectedDepartment) {
      return { success: false, error: "Selected doctor is not assigned to this department." };
    }
    if (selectedDepartment.hospitalId && selectedDepartment.hospitalId !== slot.hospitalId) {
      return {
        success: false,
        error: `${selectedDepartment.name} is not available at the selected slot's hospital. Please choose a matching slot.`,
      };
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: slot.hospitalId },
      select: { id: true },
    });

    if (!hospital) {
      return { success: false, error: "This slot is linked to an unavailable hospital. Please choose another slot." };
    }

    const existingAppointmentForSlot = await prisma.appointment.findUnique({
      where: { scheduleSlotId },
      select: { patientId: true },
    });

    if (existingAppointmentForSlot) {
      if (existingAppointmentForSlot.patientId === patient.id) {
        return { success: false, error: "You already have an appointment for this slot." };
      }
      return { success: false, error: "This slot is no longer available. Please choose another time." };
    }

    const claimedSlot = await prisma.scheduleSlot.updateMany({
      where: {
        id: scheduleSlotId,
        isBooked: false,
        isAvailable: true,
      },
      data: {
        isBooked: true,
      }
    });

    if (claimedSlot.count !== 1) {
      return { success: false, error: "This slot was just booked. Please choose another time." };
    }

    let appointment;
    try {
      appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          departmentId,
          hospitalId: slot.hospitalId,
          scheduleSlotId,
          scheduledAt: slot.startTime,
          symptoms,
          status: AppointmentStatus.PENDING,
        }
      });
    } catch (error) {
      const persistedAppointment = await prisma.appointment.findUnique({
        where: { scheduleSlotId },
        select: { id: true },
      });
      if (!persistedAppointment) {
        await prisma.scheduleSlot.update({
          where: { id: scheduleSlotId },
          data: { isBooked: false },
        });
      }
      throw error;
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
          message: `A new patient (${session.user.name}) has scheduled an appointment for ${format(slot.startTime, "p")}.`,
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
