import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScheduleManager } from "@/components/doctor/ScheduleManager";

export default async function DoctorSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      departments: {
        select: {
          id: true,
          name: true,
          hospitalId: true,
        }
      },
      schedules: {
        select: {
          id: true,
          doctorId: true,
          hospitalId: true,
          startTime: true,
          endTime: true,
          isAvailable: true,
          isBooked: true,
        },
        orderBy: { startTime: "asc" }
      }
    }
  });

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Doctor Profile Not Found</h2>
        <p className="text-muted-foreground mt-2">Please contact administration to set up your profile.</p>
      </div>
    );
  }

  const hospitalId = doctor.departments[0]?.hospitalId;
  const hasRoom = !!doctor.roomNumber && doctor.roomNumber.trim() !== "";

  const hospitalIds = Array.from(new Set([
    ...doctor.departments.map((department) => department.hospitalId).filter(Boolean),
    ...doctor.schedules.map((slot) => slot.hospitalId).filter(Boolean),
  ])) as string[];

  const hospitalRecords = hospitalIds.length > 0 ? await prisma.hospital.findMany({
    where: { id: { in: hospitalIds } },
    select: { id: true, name: true, address: true }
  }) : [];

  const hospitalById = new Map(hospitalRecords.map((hospital) => [hospital.id, hospital]));

  const hospitals = Array.from(
    new Map(
      doctor.departments
        .map((department) => department.hospitalId ? hospitalById.get(department.hospitalId) : null)
        .filter(Boolean)
        .map((hospital) => [hospital!.id, hospital!])
    ).values()
  );

  const slots = doctor.schedules.map((slot) => ({
    id: slot.id,
    doctorId: slot.doctorId,
    hospitalId: slot.hospitalId,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    isAvailable: slot.isAvailable,
    isBooked: slot.isBooked,
    hospital: hospitalById.get(slot.hospitalId) ?? null,
  }));

  const hospitalIds = Array.from(new Set([
    ...doctor.departments.map((department) => department.hospitalId).filter(Boolean),
    ...doctor.schedules.map((slot) => slot.hospitalId).filter(Boolean),
  ])) as string[];

  const hospitalRecords = hospitalIds.length > 0 ? await prisma.hospital.findMany({
    where: { id: { in: hospitalIds } },
    select: { id: true, name: true, address: true }
  }) : [];

  const hospitalById = new Map(hospitalRecords.map((hospital) => [hospital.id, hospital]));

  const hospitals = Array.from(
    new Map(
      doctor.departments
        .map((department) => department.hospitalId ? hospitalById.get(department.hospitalId) : null)
        .filter(Boolean)
        .map((hospital) => [hospital!.id, hospital!])
    ).values()
  );

  const slots = doctor.schedules.map((slot) => ({
    id: slot.id,
    doctorId: slot.doctorId,
    hospitalId: slot.hospitalId,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    isAvailable: slot.isAvailable,
    isBooked: slot.isBooked,
    hospital: hospitalById.get(slot.hospitalId) ?? null,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-black tracking-widest text-primary/80 mb-1">Time Management</div>
          <h1 className="text-3xl font-black tracking-tight">Slot Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set your availability for assigned hospitals and manage patient booking slots.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            Room number is stored globally on the doctor profile in this schema; hospital-specific room assignment is not modeled yet.
          </p>
        </div>
      </div>

      <ScheduleManager hospitals={hospitals} initialSlots={slots} />
    </div>
  );
}
