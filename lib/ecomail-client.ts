// Ecomail.cz API client
// Docs: https://ecomail.cz/api-docs

const ECOMAIL_BASE = 'https://api2.ecomailapp.cz';

interface EcomailConfig {
  apiKey: string;
}

function getHeaders(config: EcomailConfig) {
  return {
    'Content-Type': 'application/json',
    'key': config.apiKey,
  };
}

export async function sendTransactional(config: EcomailConfig, data: {
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlBody?: string;
  textBody?: string;
}) {
  const res = await fetch(`${ECOMAIL_BASE}/transactional/send`, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({
      message: {
        from_email: data.from.email,
        from_name: data.from.name,
        to: data.to.map(t => ({ email: t.email, name: t.name })),
        subject: data.subject,
        html: data.htmlBody,
        text: data.textBody,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ecomail API ${res.status}: ${err}`);
  }

  return res.json();
}

export async function sendTemplate(config: EcomailConfig, data: {
  templateId: number;
  to: Array<{ email: string; name?: string }>;
  mergeVars?: Array<{ name: string; content: string }>;
  from?: { email: string; name?: string };
}) {
  const res = await fetch(`${ECOMAIL_BASE}/transactional/send-template`, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({
      message: {
        template_id: data.templateId,
        to: data.to.map(t => ({ email: t.email, name: t.name })),
        global_merge_vars: data.mergeVars,
        ...(data.from && {
          from_email: data.from.email,
          from_name: data.from.name,
        }),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ecomail API ${res.status}: ${err}`);
  }

  return res.json();
}

export async function subscribe(config: EcomailConfig, listId: string, data: {
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const res = await fetch(`${ECOMAIL_BASE}/lists/${listId}/subscribe`, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({
      subscriber_data: {
        email: data.email,
        name: data.firstName,
        surname: data.lastName,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ecomail API ${res.status}: ${err}`);
  }

  return res.json();
}

export async function triggerAutomation(config: EcomailConfig, automationId: string, email: string) {
  const res = await fetch(`${ECOMAIL_BASE}/automations/${automationId}/trigger`, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ecomail API ${res.status}: ${err}`);
  }

  return res.json();
}

export async function ping(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${ECOMAIL_BASE}/lists`, {
      headers: { 'key': apiKey },
    });
    return res.ok;
  } catch {
    return false;
  }
}
