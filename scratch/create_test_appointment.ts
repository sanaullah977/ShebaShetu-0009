import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.user.findUnique({
    where: { email: "qa_doctor@test.com" },
    include: { doctorProfile: true },
  });

  if (!doctor || !doctor.doctorProfile) {
    console.log("QA Doctor not found.");
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pendingToday = await prisma.appointment.findMany({
    where: { 
      doctorId: doctor.doctorProfile.id,
      scheduledAt: { gte: today, lt: tomorrow },
      status: "PENDING"
    },
  });

  console.log("Pending appointments for today:", pendingToday.length);

  if (pendingToday.length === 0) {
    console.log("Creating a test appointment for today...");
    // Find a patient
    const patient = await prisma.patientProfile.findFirst();
    if (!patient) {
        console.log("No patients found. Create a patient first.");
        return;
    }

    // Find or create a hospital
    let hospital = await prisma.hospital.findFirst();
    if (!hospital) {
        console.log("Creating a test hospital...");
        hospital = await prisma.hospital.create({
            data: {
                name: "Test Hospital",
                address: "123 Test St",
            }
        });
    }

    // Find or create a department
    let department = await prisma.department.findFirst();
    if (!department) {
        console.log("Creating a test department...");
        department = await prisma.department.create({
            data: {
                name: "General Medicine",
                hospitalId: hospital.id,
            }
        });
    }

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.doctorProfile.id,
        departmentId: department.id,
        hospitalId: hospital.id,
        scheduledAt: new Date(),
        status: "PENDING",
        symptoms: "Headache and fever",
      },
    });
    console.log("Test appointment created for today.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
