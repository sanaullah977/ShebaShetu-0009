import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/unauthorized");

  const [users, hospitals, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
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
          select: {
            age: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    }),
    prisma.hospital.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        hospitalId: true,
        hospital: { select: { id: true, name: true, address: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin</div>
        <h1 className="mt-1 text-3xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user status, doctor hospital/department assignments, and receptionist hospital scope.
        </p>
      </div>

      <UserManagementPanel
        initialUsers={users as any}
        hospitals={hospitals}
        departments={departments}
      />
    </div>
  );
}
