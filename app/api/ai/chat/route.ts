import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { errorResponse, successResponse } from '@/lib/api-helpers';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    if (!message) return errorResponse('message is required', 400);

    if (!process.env.GOOGLE_AI_API_KEY) {
      return errorResponse('GOOGLE_AI_API_KEY is not configured', 500);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(`Odpovídej česky. Dotaz klienta: ${message}`);
    return successResponse({ response: result.response.text() });
  } catch (error: any) {
    return errorResponse(error.message || 'AI error', 500);
  }
}
