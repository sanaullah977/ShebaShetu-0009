"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateManagedUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().max(30).optional().nullable(),
  isActive: z.boolean(),
  specialization: z.string().trim().max(80).optional().nullable(),
  consultationFee: z.coerce.number().min(0).optional().nullable(),
  roomNumber: z.string().trim().max(30).optional().nullable(),
  departmentIds: z.array(z.string()).optional(),
  hospitalId: z.string().optional().nullable(),
});

const createHospitalSchema = z.object({
  name: z.string().trim().min(2, "Hospital name is required").max(120),
  address: z.string().trim().min(2, "Address is required").max(240),
  phone: z.string().trim().max(30).optional().nullable(),
});

const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, "Department name is required").max(80),
  hospitalId: z.string().min(1, "Hospital is required"),
  description: z.string().trim().max(240).optional().nullable(),
});

async function requireAdmin() {
  const session = await auth();
  const actorRole = (session?.user as any)?.role as string | undefined;
  const actorId = (session?.user as any)?.id as string | undefined;

  if (!session?.user || !actorId || (actorRole !== "ADMIN" && actorRole !== "SUPER_ADMIN")) {
    return { error: "Unauthorized" as const };
  }

  return { session, actorRole, actorId };
}

export async function createHospital(input: z.infer<typeof createHospitalSchema>) {
  const guard = await requireAdmin();
  if ("error" in guard) return { success: false, error: guard.error };

  const parsed = createHospitalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Please check the hospital fields.",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await prisma.hospital.findFirst({
      where: { name: parsed.data.name },
      select: { id: true },
    });

    if (existing) return { success: false, error: "A hospital with this name already exists." };

    const hospital = await prisma.hospital.create({
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone || null,
      },
      select: { id: true, name: true, address: true, phone: true },
    });

    revalidatePath("/admin/users");
    return { success: true, hospital };
  } catch (error) {
    console.error("[CREATE_HOSPITAL_ERROR]", error);
    return { success: false, error: "Failed to create hospital." };
  }
}

export async function createDepartment(input: z.infer<typeof createDepartmentSchema>) {
  const guard = await requireAdmin();
  if ("error" in guard) return { success: false, error: guard.error };

  const parsed = createDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Please check the department fields.",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: parsed.data.hospitalId },
      select: { id: true, name: true, address: true },
    });
    if (!hospital) return { success: false, error: "Selected hospital was not found." };

    const existing = await prisma.department.findUnique({
      where: { name: parsed.data.name },
      select: { id: true },
    });
    if (existing) return { success: false, error: "A department with this name already exists." };

    const department = await prisma.department.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        hospitalId: hospital.id,
        doctorIds: [],
      },
      select: {
        id: true,
        name: true,
        hospitalId: true,
        hospital: { select: { id: true, name: true, address: true } },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/doctor/schedule");
    return { success: true, department };
  } catch (error) {
    console.error("[CREATE_DEPARTMENT_ERROR]", error);
    return { success: false, error: "Failed to create department." };
  }
}

export async function updateManagedUser(input: z.infer<typeof updateManagedUserSchema>) {
  const guard = await requireAdmin();
  if ("error" in guard) return { success: false, error: guard.error };
  const { actorRole, actorId } = guard;

  const parsed = updateManagedUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the user management fields.",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const target = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { doctorProfile: true, receptionProfile: true },
    });

    if (!target) return { success: false, error: "User not found" };
    if (actorRole === "ADMIN" && target.role === "SUPER_ADMIN") {
      return { success: false, error: "Only a super admin can manage a super admin account." };
    }
    if (target.id === actorId && !data.isActive) {
      return { success: false, error: "You cannot deactivate your own account." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          name: data.name,
          phone: data.phone || null,
          isActive: data.isActive,
        },
      });

      if (target.role === "DOCTOR") {
        const departmentIds = Array.from(new Set(data.departmentIds ?? []));
        const departments = departmentIds.length > 0
          ? await tx.department.findMany({
              where: { id: { in: departmentIds } },
              select: { id: true },
            })
          : [];

        if (departments.length !== departmentIds.length) {
          throw new Error("Selected department is unavailable.");
        }

        const doctor = await tx.doctorProfile.upsert({
          where: { userId: target.id },
          update: {
            specialization: data.specialization || "General Medicine",
            consultationFee: data.consultationFee ?? null,
            roomNumber: data.roomNumber || null,
            departmentIds,
          },
          create: {
            userId: target.id,
            specialization: data.specialization || "General Medicine",
            consultationFee: data.consultationFee ?? null,
            roomNumber: data.roomNumber || null,
            departmentIds,
          },
        });

        const allDepartments = await tx.department.findMany({
          select: { id: true, doctorIds: true },
        });
        const selectedDepartmentIds = new Set(departmentIds);

        for (const department of allDepartments) {
          const nextDoctorIds = new Set(department.doctorIds);
          const hadDoctor = nextDoctorIds.has(doctor.id);

          if (selectedDepartmentIds.has(department.id)) {
            nextDoctorIds.add(doctor.id);
          } else {
            nextDoctorIds.delete(doctor.id);
          }

          const changed = hadDoctor !== nextDoctorIds.has(doctor.id);
          if (changed) {
            await tx.department.update({
              where: { id: department.id },
              data: { doctorIds: Array.from(nextDoctorIds) },
            });
          }
        }
      }

      if (target.role === "RECEPTION") {
        const hospitalId = data.hospitalId || null;
        if (hospitalId) {
          const hospital = await tx.hospital.findUnique({
            where: { id: hospitalId },
            select: { id: true },
          });
          if (!hospital) throw new Error("Selected hospital is unavailable.");
        }

        await tx.receptionProfile.upsert({
          where: { userId: target.id },
          update: { hospitalId },
          create: { userId: target.id, hospitalId },
        });
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");
    revalidatePath("/doctor/settings");
    revalidatePath("/doctor/schedule");
    revalidatePath("/patient/booking");
    revalidatePath("/reception/dashboard");
    revalidatePath("/reception/queue");

    const user = await getManagedUser(data.userId);
    return { success: true, user };
  } catch (error) {
    console.error("[UPDATE_MANAGED_USER_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user.",
    };
  }
}

async function getManagedUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      doctorProfile: {
        select: {
          id: true,
          specialization: true,
          consultationFee: true,
          roomNumber: true,
          departmentIds: true,
          departments: {
            select: {
              id: true,
              name: true,
              hospitalId: true,
              hospital: { select: { id: true, name: true, address: true } },
            },
          },
        },
      },
      receptionProfile: {
        select: {
          hospitalId: true,
          hospital: { select: { id: true, name: true, address: true } },
        },
      },
      patientProfile: {
        select: { age: true, gender: true, bloodGroup: true },
      },
    },
  });
}
