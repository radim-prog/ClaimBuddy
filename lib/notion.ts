const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function notionHeaders() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error('Missing NOTION_TOKEN');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

export interface PublicCaseInput {
  fullName: string;
  email: string;
  phone?: string;
  insuranceType: string;
  insuranceCompany: string;
  incidentDate: string;
  incidentLocation: string;
  incidentDescription: string;
  claimAmount?: number;
}

function toTitle(text: string) {
  return [{ type: 'text', text: { content: text } }];
}

function toRichText(text: string) {
  return [{ type: 'text', text: { content: text } }];
}

export async function createNotionCase(input: PublicCaseInput) {
  const dbId = process.env.NOTION_CASES_DB_ID;
  if (!dbId) {
    throw new Error('Missing NOTION_CASES_DB_ID');
  }

  const caseNumber = `CB-${Date.now()}`;

  const payload = {
    parent: { database_id: dbId },
    properties: {
      Name: { title: toTitle(`${caseNumber} - ${input.fullName}`) },
      CaseNumber: { rich_text: toRichText(caseNumber) },
      FullName: { rich_text: toRichText(input.fullName) },
      Email: { email: input.email },
      Phone: { rich_text: toRichText(input.phone || '') },
      InsuranceType: { rich_text: toRichText(input.insuranceType) },
      InsuranceCompany: { rich_text: toRichText(input.insuranceCompany) },
      IncidentDate: { date: { start: input.incidentDate } },
      IncidentLocation: { rich_text: toRichText(input.incidentLocation) },
      IncidentDescription: { rich_text: toRichText(input.incidentDescription) },
      ClaimAmount: { number: input.claimAmount || 0 },
      Status: { select: { name: 'new' } },
      Source: { select: { name: 'website' } },
    },
  };

  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion create case failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return {
    id: data.id as string,
    url: data.url as string,
    caseNumber,
  };
}

export async function listNotionCases(limit = 20) {
  const dbId = process.env.NOTION_CASES_DB_ID;
  if (!dbId) {
    throw new Error('Missing NOTION_CASES_DB_ID');
  }

  const response = await fetch(`${NOTION_API_BASE}/databases/${dbId}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ page_size: limit, sorts: [{ timestamp: 'created_time', direction: 'descending' }] }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion list cases failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return (data.results || []).map((item: any) => ({
    id: item.id,
    url: item.url,
    createdTime: item.created_time,
  }));
}
