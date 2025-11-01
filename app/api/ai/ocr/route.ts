import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { ocrSchema } from '@/lib/validations';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rateLimiters, checkRateLimit, rateLimitExceeded } from '@/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // RATE LIMITING: 10 OCR requests per hour per user
    const rateLimit = await checkRateLimit(rateLimiters.ocr, user.uid);
    if (!rateLimit.success) {
      return rateLimitExceeded(rateLimit.reset);
    }

    const body = await request.json();

    // Validace
    const validation = ocrSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { imageUrl } = validation.data;

    // Použij Gemini Vision pro OCR
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyzuj tento dokument a extrahuj následující informace ve formátu JSON:
- invoiceNumber: Číslo faktury/dokladu
- date: Datum
- amount: Celková částka (pouze číslo)
- vendor: Dodavatel/prodejce
- items: Pole položek s popisem, množstvím a cenou

Pokud některá informace chybí, použij null. Odpověď musí být validní JSON.`;

    // Fetch obrázku
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);

    const response = result.response.text();

    // Parsuj JSON z odpovědi
    let extractedData;
    try {
      // Odstraň markdown code blocks pokud existují
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Pokud se nepodaří parsovat, vrať prázdný objekt
      extractedData = {
        invoiceNumber: null,
        date: null,
        amount: null,
        vendor: null,
        items: [],
      };
    }

    return Response.json(
      {
        success: true,
        data: {
          extractedData,
          confidence: 0.85, // Placeholder - Gemini API neposkytuje confidence score
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error: any) {
    console.error('POST /api/ai/ocr error:', error);
    return errorResponse(error.message || 'OCR service error', 500);
  }
}
