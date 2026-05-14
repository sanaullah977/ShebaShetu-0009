import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) return NextResponse.json({ results: [] });

  const patients = await prisma.user.findMany({
    where: {
      role: "PATIENT",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    },
    include: { patientProfile: true },
    take: 5
  });

  const tokens = await prisma.queueToken.findMany({
    where: {
      OR: [
        { tokenNumber: { contains: q, mode: "insensitive" } },
        { appointment: { patient: { user: { name: { contains: q, mode: "insensitive" } } } } }
      ]
    },
    include: {
      appointment: {
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      }
    },
    take: 5
  });

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    },
    include: { doctorProfile: true },
    take: 5
  });

  const results = [
    ...tokens.map(t => ({ 
      type: "TOKEN", 
      id: t.id,
      title: t.tokenNumber, 
      subtitle: `Patient: ${t.appointment.patient.user.name} · Dr. ${t.appointment.doctor.user.name}`,
      status: t.status,
      data: t
    })),
    ...patients.map(p => ({ 
      type: "PATIENT", 
      id: p.id,
      title: p.name, 
      subtitle: `Patient · ${p.email || "No email"}`,
      data: p
    })),
    ...doctors.map(d => ({ 
      type: "DOCTOR", 
      id: d.id,
      title: d.name, 
      subtitle: `Doctor · ${d.doctorProfile?.specialization || "Specialist"}`,
      data: d
    })),
  ];

  return NextResponse.json({ results });
}
