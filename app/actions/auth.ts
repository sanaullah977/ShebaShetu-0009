"use server"

import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["PATIENT", "DOCTOR", "RECEPTION", "ADMIN"] as const),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Password and confirmation do not match",
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export async function register(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validated = registerSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        details: validated.error.flatten().fieldErrors 
      };
    }

    const { name, email, password, role } = validated.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role as UserRole,
        }
      });

      // Create role-specific profile
      if (role === "PATIENT") {
        await tx.patientProfile.create({
          data: { userId: user.id }
        });
      } else if (role === "DOCTOR") {
        await tx.doctorProfile.create({
          data: { 
            userId: user.id,
            specialization: "General Physician" // Default for now
          }
        });
      } else if (role === "RECEPTION") {
        await tx.receptionProfile.create({
          data: { userId: user.id }
        });
      }

      return user;
    });

    return { success: true, userId: result.id };
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return { success: false, error: "An unexpected error occurred during registration." };
  }
}

export async function requestPasswordReset(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validated = forgotPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Enter a valid email address",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: validated.data.email },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const handlers = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "SUPER_ADMIN"] },
          isActive: true,
        },
        select: { id: true },
      });

      if (handlers.length > 0) {
        await prisma.notification.createMany({
          data: handlers.map((handler) => ({
            userId: handler.id,
            type: "SYSTEM_ALERT",
            title: "Password Reset Requested",
            message: `${user.name || user.email || "A user"} requested password reset support.`,
          })),
        });
      }
    }

    return {
      success: true,
      message: "Password reset request submitted. Please contact support or check your email if email service is configured.",
    };
  } catch (error) {
    console.error("[PASSWORD_RESET_REQUEST_ERROR]", error);
    return { success: false, error: "Unable to submit password reset request. Please try again." };
  }
}
