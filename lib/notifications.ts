import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'noreply@pojistna-pomoc.cz';
}

export async function notifyCaseCreated(input: { email: string; fullName: string; caseNumber: string }) {
  const client = getResendClient();
  if (!client) return { sent: false, reason: 'missing_resend_api_key' };

  await client.emails.send({
    from: fromEmail(),
    to: input.email,
    subject: `Potvrzení přijetí případu ${input.caseNumber}`,
    text: `Dobrý den ${input.fullName},\n\npřijali jsme váš případ ${input.caseNumber}. Brzy se vám ozveme s dalším postupem.\n\nTým Pojistná Pomoc`,
  });

  return { sent: true };
}

export async function notifyCaseStatusChanged(input: {
  email: string;
  fullName: string;
  caseNumber: string;
  status: string;
}) {
  const client = getResendClient();
  if (!client) return { sent: false, reason: 'missing_resend_api_key' };

  await client.emails.send({
    from: fromEmail(),
    to: input.email,
    subject: `Aktualizace případu ${input.caseNumber}`,
    text: `Dobrý den ${input.fullName},\n\nstav vašeho případu ${input.caseNumber} byl změněn na: ${input.status}.\n\nTým Pojistná Pomoc`,
  });

  return { sent: true };
}
