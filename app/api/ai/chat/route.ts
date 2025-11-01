import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { aiChatSchema } from '@/lib/validations';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/lib/constants';
import { getCase } from '@/lib/firebase/firestore';
import { rateLimiters, checkRateLimit, rateLimitExceeded } from '@/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // RATE LIMITING: 50 chat requests per hour per user
    const rateLimit = await checkRateLimit(rateLimiters.chat, user.uid);
    if (!rateLimit.success) {
      return rateLimitExceeded(rateLimit.reset);
    }

    const body = await request.json();

    // Validace
    const validation = aiChatSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { message, caseId, conversationHistory } = validation.data;

    // Získej kontext případu, pokud je caseId poskytnuto
    let caseContext = '';
    if (caseId) {
      const caseData = await getCase(caseId);
      if (caseData && caseData.userId === user.uid) {
        caseContext = `
Kontext případu:
- Číslo případu: ${caseData.caseNumber}
- Typ pojištění: ${caseData.insuranceType}
- Pojišťovna: ${caseData.insuranceCompany}
- Datum události: ${caseData.incidentDate}
- Místo: ${caseData.incidentLocation}
- Popis: ${caseData.incidentDescription}
- Nárokovaná částka: ${caseData.claimAmount} Kč
- Status: ${caseData.status}
`;
      }
    }

    // Připrav prompt
    const systemPrompt = `Jsi ClaimBuddy AI asistent, který pomáhá lidem s pojistnými událostmi.
Tvým cílem je poskytnout užitečné rady, vysvětlit proces vyřizování pojistné události a odpovědět na dotazy.

Pravidla:
- Odpovídej vždy v češtině
- Buď konkrétní a praktický
- Pokud nevíš odpověď, řekni to upřímně
- Neposkytuj právní rady, ale obecné informace
- Buď empatický a vstřícný
- Pokud je třeba, doporuč kontaktovat pojišťovnu nebo právníka

${caseContext}`;

    // Vytvoř konverzaci
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Rozumím. Jsem připraven pomoct s pojistnou událostí. Jak vám mohu pomoci?' }],
        },
        ...(conversationHistory || []).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
      ],
      generationConfig: {
        maxOutputTokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return Response.json(
      {
        success: true,
        data: { response }
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
    console.error('POST /api/ai/chat error:', error);
    return errorResponse(error.message || 'AI service error', 500);
  }
}
