import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSymptoms } from '@/lib/ai/symptom-engine';
import { auth } from '@/auth';

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
    
    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error("[AI_SYMPTOM_ERROR]", error);
    return NextResponse.json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' } 
    }, { status: 500 });
  }
}
