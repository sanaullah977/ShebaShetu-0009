import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSymptoms } from '@/lib/ai/symptom-engine';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

const schema = z.object({ 
  symptoms: z.string().min(3, "Symptoms too short").max(2000, "Symptoms too long") 
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Please login to use AI features' } 
      }, { status: 401 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', details: result.error.errors } 
      }, { status: 400 });
    }
    
    const suggestion = analyzeSymptoms(result.data.symptoms);
    const [doctors, departments] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: { user: { isActive: true } },
        include: {
          user: { select: { name: true, image: true } },
          departments: { select: { name: true } },
        },
        take: 100,
      }),
      prisma.department.findMany({ select: { name: true } }),
    ]);

    const databaseSpecializations = Array.from(new Set([
      ...doctors.map((doctor) => doctor.specialization),
      ...departments.map((department) => department.name),
    ].filter(Boolean)));

    const requestedSpecialization = suggestion.specialization;
    const matchedSpecialization = findBestAvailableSpecialization(requestedSpecialization, databaseSpecializations)
      || requestedSpecialization;
    const needle = matchedSpecialization.toLowerCase();
    const exactDoctors = doctors.filter((doctor) => matchesDoctorSpecialization(doctor, needle));
    const nearestDoctors = exactDoctors.length > 0
      ? exactDoctors
      : doctors
          .map((doctor) => ({ doctor, score: doctorMatchScore(doctor, needle) }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.doctor);
    
    return NextResponse.json({
      success: true,
      data: {
        ...suggestion,
        specialization: matchedSpecialization,
        department: matchedSpecialization,
        requestedSpecialization: requestedSpecialization === matchedSpecialization ? null : requestedSpecialization,
        availableSpecializations: databaseSpecializations,
        doctors: nearestDoctors.slice(0, 4).map((doctor) => ({
          id: doctor.id,
          name: doctor.user.name,
          image: doctor.user.image,
          specialization: doctor.specialization,
          departments: doctor.departments.map((department) => department.name),
          consultationFee: doctor.consultationFee,
        })),
        doctorMatchType: exactDoctors.length > 0 ? "exact" : nearestDoctors.length > 0 ? "nearest" : "none",
      },
    });
  } catch (error) {
    console.error("[AI_SYMPTOM_ERROR]", error);
    return NextResponse.json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' } 
    }, { status: 500 });
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findBestAvailableSpecialization(target: string, available: string[]) {
  const normalizedTarget = normalize(target);
  const exact = available.find((item) => normalize(item) === normalizedTarget);
  if (exact) return exact;

  const containing = available.find((item) => {
    const value = normalize(item);
    return value.includes(normalizedTarget) || normalizedTarget.includes(value);
  });
  if (containing) return containing;

  return available
    .map((item) => ({ item, score: overlapScore(normalizedTarget, normalize(item)) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function matchesDoctorSpecialization(doctor: { specialization: string; departments: Array<{ name: string }> }, needle: string) {
  const values = [doctor.specialization, ...doctor.departments.map((department) => department.name)];
  return values.some((value) => normalize(value) === needle);
}

function doctorMatchScore(doctor: { specialization: string; departments: Array<{ name: string }> }, needle: string) {
  return [doctor.specialization, ...doctor.departments.map((department) => department.name)]
    .reduce((score, value) => Math.max(score, overlapScore(needle, normalize(value))), 0);
}

function overlapScore(a: string, b: string) {
  const aWords = new Set(a.split(" ").filter(Boolean));
  const bWords = new Set(b.split(" ").filter(Boolean));
  let score = 0;
  aWords.forEach((word) => {
    if (bWords.has(word)) score += 1;
  });
  return score;
}
