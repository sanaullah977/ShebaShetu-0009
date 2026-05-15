import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        queueToken: true,
        doctor: {
          include: {
            user: true
          }
        },
        department: true,
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Security: Ensure the user owns this appointment (or is staff)
    const userId = (session.user as any).id;
    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId } });
    
    if (appointment.patientId !== patientProfile?.id && (session.user as any).role === 'PATIENT') {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate how many people are ahead in the queue for this doctor/department
    const aheadCount = await prisma.queueToken.count({
      where: {
        appointment: {
          doctorId: appointment.doctorId,
          departmentId: appointment.departmentId,
        },
        status: 'WAITING',
        position: { lt: appointment.queueToken?.position || 0 }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        status: appointment.status,
        tokenNumber: appointment.queueToken?.tokenNumber,
        position: appointment.queueToken?.position,
        aheadCount,
        estimatedWait: aheadCount * 15, // Simple heuristic: 15 mins per person
        doctorName: appointment.doctor.user.name,
        departmentName: appointment.department.name,
        roomNumber: appointment.doctor.roomNumber,
      }
    });
  } catch (error) {
    console.error("[QUEUE_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
