"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const bookingSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  departmentId: z.string().min(1, "Please select a department"),
  scheduledAt: z.string().min(1, "Please select a date and time"),
  symptoms: z.string().optional(),
});

export async function bookAppointment(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = (session.user as any).id;
  
  // Fetch patient profile
  const patient = await prisma.patientProfile.findUnique({
    where: { userId }
  });

  if (!patient) throw new Error("Patient profile not found");

  const data = bookingSchema.parse({
    doctorId: formData.get("doctorId"),
    departmentId: formData.get("departmentId"),
    scheduledAt: formData.get("scheduledAt"),
    symptoms: formData.get("symptoms"),
  });

  // Fetch a default hospital if none specified (for MVP)
  const hospital = await prisma.hospital.findFirst() || await prisma.hospital.create({
    data: {
      name: "Main Hospital",
      address: "Dhaka, Bangladesh",
    }
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: data.doctorId,
      departmentId: data.departmentId,
      hospitalId: hospital.id,
      scheduledAt: new Date(data.scheduledAt),
      symptoms: data.symptoms,
      status: AppointmentStatus.PENDING,
    }
  });

  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");

  return { success: true, appointmentId: appointment.id };
}
