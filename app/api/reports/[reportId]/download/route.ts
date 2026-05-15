import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      patientId: true,
      title: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const authorized = await canAccessReport({
    userId: (session.user as any).id,
    role: (session.user as any).role,
    patientId: report.patientId,
  });

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!report.fileUrl) {
    return NextResponse.json({ error: "Report file is not available" }, { status: 404 });
  }

  if (/^https?:\/\//i.test(report.fileUrl)) {
    return NextResponse.redirect(report.fileUrl);
  }

  const publicRoot = path.resolve(process.cwd(), "public");
  const filePath = path.resolve(publicRoot, report.fileUrl.replace(/^\/+/, ""));

  if (!filePath.startsWith(publicRoot) || !existsSync(filePath)) {
    return NextResponse.json({ error: "Report file is missing" }, { status: 404 });
  }

  const file = await readFile(filePath);
  const disposition = new URL(req.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";

  return new NextResponse(file, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition": `${disposition}; filename="${report.fileName || `${report.title}.pdf`}"`,
      "Content-Type": report.mimeType || "application/octet-stream",
    },
  });
}

async function canAccessReport({
  userId,
  role,
  patientId,
}: {
  userId: string;
  role?: string;
  patientId: string;
}) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;

  if (role === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return patient?.id === patientId;
  }

  if (role === "DOCTOR") {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!doctor) return false;

    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        patientId,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });

    return !!activeAppointment;
  }

  return false;
}
