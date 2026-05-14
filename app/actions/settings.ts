"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { uploadToImgBB } from "@/lib/upload";

const profileSchema = z.object({
  name: z.string().min(2),
  image: z.string().optional(),
  // Doctor fields
  specialization: z.string().optional(),
  consultationFee: z.number().optional(),
  roomNumber: z.string().optional(),
  // Patient fields
  age: z.number().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as any).id;

  try {
    let imageUrl = data.image;
    
    // If image is base64, upload to ImgBB
    if (data.image && data.image.startsWith("data:image")) {
      const uploadedUrl = await uploadToImgBB(data.image);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    // Update base user
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: imageUrl,
      }
    });

    // Update doctor profile if it exists
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
    if (doctor) {
      await prisma.doctorProfile.update({
        where: { userId },
        data: {
          specialization: data.specialization || doctor.specialization,
          consultationFee: data.consultationFee ?? doctor.consultationFee,
          roomNumber: data.roomNumber || doctor.roomNumber,
        }
      });
    }

    // Update patient profile if it exists
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    if (patient) {
      await prisma.patientProfile.update({
        where: { userId },
        data: {
          age: data.age ?? patient.age,
          gender: data.gender || patient.gender,
          bloodGroup: data.bloodGroup || patient.bloodGroup,
          address: data.address || patient.address,
          emergencyContact: data.emergencyContact || patient.emergencyContact,
        }
      });
    }
    
    revalidatePath("/doctor/settings");
    revalidatePath("/patient/settings");
    revalidatePath("/reception/settings");
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updatePreferences(data: { emailAlerts?: boolean; queueUpdates?: boolean }) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.userPreference.upsert({
      where: { userId: (session.user as any).id },
      update: data,
      create: {
        userId: (session.user as any).id,
        ...data,
      }
    });
    
    revalidatePath("/doctor/settings");
    revalidatePath("/reception/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update preferences" };
  }
}

export async function updatePassword(current: string, next: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  if (!user || !user.passwordHash) return { success: false, error: "User not found" };

  const isValid = await bcrypt.compare(current, user.passwordHash);
  if (!isValid) return { success: false, error: "Incorrect current password" };

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  return { success: true };
}

export async function createSupportTicket(subject: string, message: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.supportTicket.create({
      data: {
        userId: (session.user as any).id,
        subject,
        message,
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to submit ticket" };
  }
}
