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

// Get all contact lists
export async function getLists(config: EcomailConfig): Promise<Array<{ id: number; name: string; subscriber_count: number }>> {
  const res = await fetch(`${ECOMAIL_BASE}/lists`, {
    headers: getHeaders(config),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Get subscribers from a list with pagination
export async function getListSubscribers(config: EcomailConfig, listId: string, page: number = 1, perPage: number = 100) {
  const res = await fetch(`${ECOMAIL_BASE}/lists/${listId}/subscribers?page=${page}&per_page=${perPage}`, {
    headers: getHeaders(config),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Update subscriber custom fields and tags
export async function updateSubscriber(config: EcomailConfig, listId: string, email: string, data: {
  firstName?: string
  lastName?: string
  customFields?: Record<string, string>
  tags?: string[]
}) {
  const subscriberData: Record<string, unknown> = {
    email,
    ...(data.firstName && { name: data.firstName }),
    ...(data.lastName && { surname: data.lastName }),
    ...(data.customFields && { custom_fields: data.customFields }),
    ...(data.tags && { tags: data.tags }),
  }

  const res = await fetch(`${ECOMAIL_BASE}/lists/${listId}/subscribe`, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({
      subscriber_data: subscriberData,
      resubscribe: true,
      update_existing: true,
      skip_confirmation: true,
    }),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Unsubscribe a contact from a list
export async function unsubscribe(config: EcomailConfig, listId: string, email: string) {
  const res = await fetch(`${ECOMAIL_BASE}/lists/${listId}/unsubscribe`, {
    method: 'DELETE',
    headers: getHeaders(config),
    body: JSON.stringify({ email }),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Add tags to a subscriber
export async function addTags(config: EcomailConfig, email: string, tags: string[]) {
  const res = await fetch(`${ECOMAIL_BASE}/subscribers/${encodeURIComponent(email)}/tags`, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({ tags }),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Remove tags from a subscriber
export async function removeTags(config: EcomailConfig, email: string, tags: string[]) {
  const res = await fetch(`${ECOMAIL_BASE}/subscribers/${encodeURIComponent(email)}/tags`, {
    method: 'DELETE',
    headers: getHeaders(config),
    body: JSON.stringify({ tags }),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Get automation list
export async function getAutomations(config: EcomailConfig) {
  const res = await fetch(`${ECOMAIL_BASE}/automations`, {
    headers: getHeaders(config),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// Get campaign stats
export async function getCampaignStats(config: EcomailConfig, campaignId: number) {
  const res = await fetch(`${ECOMAIL_BASE}/campaigns/${campaignId}/stats`, {
    headers: getHeaders(config),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
}

// List campaigns
export async function getCampaigns(config: EcomailConfig) {
  const res = await fetch(`${ECOMAIL_BASE}/campaigns`, {
    headers: getHeaders(config),
  })
  if (!res.ok) { const err = await res.text(); throw new Error(`Ecomail API ${res.status}: ${err}`) }
  return res.json()
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
