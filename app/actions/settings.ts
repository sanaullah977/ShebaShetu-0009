"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { uploadToImgBB } from "@/lib/upload";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  image: z.string().optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  specialization: z.string().trim().max(80).optional().nullable(),
  consultationFee: z.coerce.number().min(0).optional().nullable(),
  roomNumber: z.string().trim().max(30).optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().nullable(),
  age: z.coerce.number().int().min(0).max(130).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  emergencyContact: z.string().trim().max(50).optional().nullable(),
});

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as any).id;
  const role = (session.user as any).role as string | undefined;
  const parsed = profileSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted profile fields.",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: values.name,
        image: values.image || undefined,
        phone: values.phone || null,
      }
    });

    if (role === "DOCTOR") {
      await prisma.doctorProfile.update({
        where: { userId },
        data: {
          specialization: values.specialization || undefined,
          consultationFee: values.consultationFee ?? undefined,
          roomNumber: values.roomNumber || null,
        }
      });
    }

    if (role === "PATIENT") {
      await prisma.patientProfile.update({
        where: { userId },
        data: {
          gender: values.gender || null,
          bloodGroup: values.bloodGroup || null,
          age: values.age ?? null,
          address: values.address || null,
          emergencyContact: values.emergencyContact || null,
        }
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        doctorProfile: {
          select: {
            specialization: true,
            consultationFee: true,
            roomNumber: true,
          }
        },
        patientProfile: true,
        receptionProfile: {
          select: {
            hospitalId: true,
            hospital: { select: { id: true, name: true, address: true, phone: true } },
          }
        },
      }
    });
    
    revalidatePath("/patient/settings");
    revalidatePath("/doctor/settings");
    revalidatePath("/reception/settings");
    revalidatePath("/patient/dashboard");
    revalidatePath("/doctor/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updatePreferences(data: { emailAlerts?: boolean; queueUpdates?: boolean }) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const preferences = await prisma.userPreference.upsert({
      where: { userId: (session.user as any).id },
      update: data,
      create: {
        userId: (session.user as any).id,
        ...data,
      }
    });
    
    revalidatePath("/patient/settings");
    revalidatePath("/doctor/settings");
    revalidatePath("/reception/settings");
    return { success: true, preferences: updatedPreferences(data, preferences) };
  } catch (error) {
    return { success: false, error: "Failed to update preferences" };
  }
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[a-z]/, "New password must include a lowercase letter")
    .regex(/[A-Z]/, "New password must include an uppercase letter")
    .regex(/[0-9]/, "New password must include a number"),
  confirmPassword: z.string().min(1, "Please confirm the new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "New password and confirmation do not match",
}).refine((data) => data.currentPassword !== data.newPassword, {
  path: ["newPassword"],
  message: "New password must be different from the current password",
});

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = passwordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the password fields.",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  if (!user) return { success: false, error: "User not found" };
  if (!user.passwordHash) {
    return {
      success: false,
      error: "Password update is unavailable for this account. Please use your social login provider.",
    };
  }

  const { currentPassword, newPassword } = parsed.data;
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) return { success: false, error: "Incorrect current password" };

  const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
  if (sameAsCurrent) {
    return { success: false, error: "New password must be different from the current password" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  return { success: true };
}

export async function createSupportTicket(subject: string, message: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const input = z.object({
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(2000),
  }).safeParse({ subject, message });

  if (!input.success) {
    return { success: false, error: "Please add a clear subject and message." };
  }

  try {
    const submitterName = session.user.name || "A user";
    const duplicateWindow = new Date(Date.now() - 10_000);
    const duplicateTicket = await prisma.supportTicket.findFirst({
      where: {
        userId: (session.user as any).id,
        subject: input.data.subject,
        message: input.data.message,
        createdAt: { gte: duplicateWindow },
      },
      orderBy: { createdAt: "desc" },
    });

    if (duplicateTicket) {
      return {
        success: true,
        ticket: {
          id: duplicateTicket.id,
          subject: duplicateTicket.subject,
          message: duplicateTicket.message,
          status: duplicateTicket.status,
          priority: duplicateTicket.priority,
          category: duplicateTicket.category,
          createdAt: duplicateTicket.createdAt.toISOString(),
          updatedAt: duplicateTicket.updatedAt.toISOString(),
        }
      };
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: (session.user as any).id,
        subject: input.data.subject,
        message: input.data.message,
      }
    });

    const handlers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        isActive: true,
      },
      select: { id: true }
    });

    if (handlers.length > 0) {
      await prisma.notification.createMany({
        data: handlers.map((handler) => ({
          userId: handler.id,
          title: "New Support Ticket",
          message: `${submitterName} submitted: ${ticket.subject}`,
          type: "NEW_MESSAGE",
          link: "/admin/support",
        }))
      });
    }

    revalidatePath("/patient/support");
    revalidatePath("/doctor/support");
    revalidatePath("/reception/support");

    return {
      success: true,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    return { success: false, error: "Failed to submit ticket" };
  }
}

function updatedPreferences(
  patch: { emailAlerts?: boolean; queueUpdates?: boolean },
  persisted: { emailAlerts: boolean; queueUpdates: boolean } | null,
) {
  return {
    emailAlerts: patch.emailAlerts ?? persisted?.emailAlerts ?? true,
    queueUpdates: patch.queueUpdates ?? persisted?.queueUpdates ?? true,
  };
}
