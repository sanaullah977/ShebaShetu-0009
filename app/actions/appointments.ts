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
            departments: { select: { id: true } },
          }
        },
      }
    });

    if (!slot || !slot.isAvailable || slot.isBooked) {
      return { success: false, error: "This slot is no longer available. Please choose another time." };
    }

    if (slot.doctorId !== doctorId) {
      return { success: false, error: "Selected slot does not belong to this doctor." };
    }

    if (!slot.doctor.departments.some((department) => department.id === departmentId)) {
      return { success: false, error: "Selected doctor is not assigned to this department." };
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: slot.hospitalId },
      select: { id: true },
    });

    if (!hospital) {
      return { success: false, error: "This slot is linked to an unavailable hospital. Please choose another slot." };
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
      await prisma.scheduleSlot.update({
        where: { id: scheduleSlotId },
        data: { isBooked: false },
      });
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
