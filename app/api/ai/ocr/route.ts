import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';

const schema = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().default('image/png'),
  hint: z.string().optional(),
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  if (!process.env.GOOGLE_AI_API_KEY) {
    return errorResponse('GOOGLE_AI_API_KEY is not configured', 503);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid OCR payload', 400);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent([
      {
        inlineData: {
          data: parsed.data.imageBase64,
          mimeType: parsed.data.mimeType,
        },
      },
      {
        text: `Jsi OCR asistent. Vrať co nejpřesněji text z dokumentu. Odpověď dej česky. Kontext: ${
          parsed.data.hint || 'pojistný dokument'
        }.`,
      },
    ]);

    return successResponse({ text: result.response.text() });
  } catch (error: any) {
    return errorResponse(error.message || 'OCR processing failed', 500);
  }
}
