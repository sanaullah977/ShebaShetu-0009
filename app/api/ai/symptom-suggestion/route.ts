import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSymptoms } from '@/lib/ai/symptom-engine';

const schema = z.object({ 
  symptoms: z.string().min(3).max(2000) 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symptoms } = schema.parse(body);
    
    const result = analyzeSymptoms(symptoms);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', details: error.errors } 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Something went wrong' } 
    }, { status: 500 });
  }
}
