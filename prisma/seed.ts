import { AppointmentStatus, PrismaClient, ReportType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const QA_PASSWORD = "Password123";

async function main() {
  const passwordHash = await bcrypt.hash(QA_PASSWORD, 10);

  const central = await findOrCreateHospital("Seba Setu Central Hospital", {
    address: "Dhanmondi, Dhaka",
    phone: "+880 1700 000001",
  });
  const north = await findOrCreateHospital("Seba Setu North Hospital", {
    address: "Uttara, Dhaka",
    phone: "+880 1700 000002",
  });

  const medicine = await upsertDepartment("General Medicine", central.id, "General medicine and health checkups");
  const cardiology = await upsertDepartment("Cardiology", north.id, "Heart and cardiovascular care");

  await Promise.all([
    upsertDepartment("Pediatrics", central.id, "Child health and wellness"),
    upsertDepartment("Dermatology", central.id, "Skin and hair care"),
    upsertDepartment("Neurology", central.id, "Brain and nervous system"),
    upsertDepartment("Dental", central.id, "Oral health and surgery"),
    upsertDepartment("Nephrology", central.id, "Kidney and renal care"),
    upsertDepartment("Pulmonology", central.id, "Lung and respiratory care"),
    upsertDepartment("Oncology", central.id, "Cancer care"),
    upsertDepartment("Emergency Medicine", central.id, "Urgent and emergency care"),
  ]);

  const [adminUser, doctorUser, patientUser, receptionUser] = await Promise.all([
    upsertUser("qa.admin@shebasetu.local", "QA Admin", UserRole.ADMIN, passwordHash),
    upsertUser("qa.doctor@shebasetu.local", "QA Doctor", UserRole.DOCTOR, passwordHash),
    upsertUser("qa.patient@shebasetu.local", "QA Patient", UserRole.PATIENT, passwordHash),
    upsertUser("qa.reception@shebasetu.local", "QA Receptionist", UserRole.RECEPTION, passwordHash),
  ]);

  const doctor = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {
      specialization: "General Medicine",
      consultationFee: 800,
      roomNumber: "C-204",
      departmentIds: [medicine.id, cardiology.id],
    },
    create: {
      userId: doctorUser.id,
      specialization: "General Medicine",
      licenseNo: "QA-DOC-001",
      consultationFee: 800,
      roomNumber: "C-204",
      departmentIds: [medicine.id, cardiology.id],
    },
  });

  await Promise.all([
    addDoctorToDepartment(medicine.id, doctor.id),
    addDoctorToDepartment(cardiology.id, doctor.id),
  ]);

  const patient = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {
      age: 32,
      gender: "Male",
      bloodGroup: "O+",
      address: "QA Patient Address",
      emergencyContact: "+880 1700 000003",
    },
    create: {
      userId: patientUser.id,
      age: 32,
      gender: "Male",
      bloodGroup: "O+",
      address: "QA Patient Address",
      emergencyContact: "+880 1700 000003",
    },
  });

  await prisma.receptionProfile.upsert({
    where: { userId: receptionUser.id },
    update: { hospitalId: central.id },
    create: { userId: receptionUser.id, hospitalId: central.id },
  });

  await Promise.all([
    ensurePreference(adminUser.id),
    ensurePreference(doctorUser.id),
    ensurePreference(patientUser.id),
    ensurePreference(receptionUser.id),
  ]);

  await repairOrphanDepartments(central.id);
  await repairOrphanSlots(central.id);
  await ensureFutureSlots(doctor.id, central.id, north.id);
  await ensureQaReport(patient.id);

  console.log("QA seed complete.");
  console.log("Accounts use password:", QA_PASSWORD);
  console.log("Admin:", adminUser.email);
  console.log("Doctor:", doctorUser.email);
  console.log("Patient:", patientUser.email);
  console.log("Reception:", receptionUser.email);
}

async function findOrCreateHospital(name: string, data: { address: string; phone: string }) {
  const existing = await prisma.hospital.findFirst({ where: { name } });
  if (existing) {
    return prisma.hospital.update({ where: { id: existing.id }, data });
  }

  return prisma.hospital.create({
    data: { name, ...data },
  });
}

async function upsertDepartment(name: string, hospitalId: string, description: string) {
  return prisma.department.upsert({
    where: { name },
    update: { description, hospitalId },
    create: { name, description, hospitalId, doctorIds: [] },
  });
}

async function upsertUser(email: string, name: string, role: UserRole, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash,
      isActive: true,
      phone: "+880 1700 000000",
    },
    create: {
      email,
      name,
      role,
      passwordHash,
      isActive: true,
      phone: "+880 1700 000000",
    },
  });
}

async function ensurePreference(userId: string) {
  await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: { userId, emailAlerts: true, queueUpdates: true, marketingEmails: false },
  });
}

async function addDoctorToDepartment(departmentId: string, doctorId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { doctorIds: true },
  });
  const doctorIds = new Set(department?.doctorIds ?? []);
  doctorIds.add(doctorId);

  await prisma.department.update({
    where: { id: departmentId },
    data: { doctorIds: Array.from(doctorIds) },
  });
}

async function repairOrphanDepartments(defaultHospitalId: string) {
  const hospitals = await prisma.hospital.findMany({ select: { id: true } });
  const hospitalIds = new Set(hospitals.map((hospital) => hospital.id));
  const departments = await prisma.department.findMany({ select: { id: true, hospitalId: true } });

  for (const department of departments) {
    if (!department.hospitalId || !hospitalIds.has(department.hospitalId)) {
      await prisma.department.update({
        where: { id: department.id },
        data: { hospitalId: defaultHospitalId },
      });
    }
  }
}

async function repairOrphanSlots(defaultHospitalId: string) {
  const hospitals = await prisma.hospital.findMany({ select: { id: true } });
  const hospitalIds = new Set(hospitals.map((hospital) => hospital.id));
  const slots = await prisma.scheduleSlot.findMany({ select: { id: true, hospitalId: true } });

  for (const slot of slots) {
    if (!hospitalIds.has(slot.hospitalId)) {
      await prisma.scheduleSlot.update({
        where: { id: slot.id },
        data: { hospitalId: defaultHospitalId },
      });
    }
  }
}

async function ensureFutureSlots(doctorId: string, centralHospitalId: string, northHospitalId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setSeconds(0, 0);

  const slots = [
    { hospitalId: centralHospitalId, hour: 9, minute: 0 },
    { hospitalId: centralHospitalId, hour: 10, minute: 0 },
    { hospitalId: northHospitalId, hour: 11, minute: 0 },
  ];

  for (const slot of slots) {
    const startTime = new Date(tomorrow);
    startTime.setHours(slot.hour, slot.minute, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const existing = await prisma.scheduleSlot.findFirst({
      where: { doctorId, startTime },
    });

    if (existing) {
      await prisma.scheduleSlot.update({
        where: { id: existing.id },
        data: {
          hospitalId: slot.hospitalId,
          endTime,
          isAvailable: true,
          isBooked: false,
        },
      });
    } else {
      await prisma.scheduleSlot.create({
        data: {
          doctorId,
          hospitalId: slot.hospitalId,
          startTime,
          endTime,
          isAvailable: true,
          isBooked: false,
        },
      });
    }
  }
}

async function ensureQaReport(patientId: string) {
  const existing = await prisma.report.findFirst({
    where: { patientId, title: "QA Blood Test Report" },
  });

  const data = {
    patientId,
    appointmentIds: [],
    title: "QA Blood Test Report",
    type: ReportType.LAB,
    fileUrl: "/reports/qa-lab-report.pdf",
    fileName: "qa-lab-report.pdf",
    mimeType: "application/pdf",
    sizeBytes: 640,
  };

  if (existing) {
    await prisma.report.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.report.create({ data });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
