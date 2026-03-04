const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export const NOTION_CASE_STATUSES = ['new', 'in_progress', 'waiting_client', 'resolved', 'rejected'] as const;
export type NotionCaseStatus = (typeof NOTION_CASE_STATUSES)[number];

export const NOTION_CASE_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type NotionCasePriority = (typeof NOTION_CASE_PRIORITIES)[number];

let schemaEnsurePromise: Promise<void> | null = null;

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

function getCasesDbId() {
  const dbId = process.env.NOTION_CASES_DB_ID;
  if (!dbId) {
    throw new Error('Missing NOTION_CASES_DB_ID');
  }
  return dbId;
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

function sanitizeMultiline(text: string) {
  return text.replace(/\r\n/g, '\n').trim();
}

function normalizeLine(text: string) {
  return text.replace(/[\r\n]+/g, ' ').trim();
}

function readRichTextProperty(page: any, key: string) {
  const value = page?.properties?.[key];
  if (!value) return '';

  if (value.type === 'title') {
    return (value.title || []).map((v: any) => v.plain_text || '').join('');
  }
  if (value.type === 'rich_text') {
    return (value.rich_text || []).map((v: any) => v.plain_text || '').join('');
  }
  return '';
}

function readDateProperty(page: any, key: string) {
  return page?.properties?.[key]?.date?.start || null;
}

function readEmailProperty(page: any, key: string) {
  return page?.properties?.[key]?.email || '';
}

function readNumberProperty(page: any, key: string) {
  return page?.properties?.[key]?.number ?? 0;
}

function readSelectProperty(page: any, key: string) {
  return page?.properties?.[key]?.select?.name || '';
}

function parseLogLines(value: string) {
  if (!value) return [] as Array<{ at: string; type: string; actor: string; message: string }>;

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [at, type, actor, ...rest] = line.split('|');
      return {
        at: at || '',
        type: type || 'info',
        actor: actor || 'system',
        message: rest.join('|') || '',
      };
    });
}

function parseDocuments(value: string) {
  if (!value) return [] as Array<{ name: string; url: string; size: number; uploadedBy: string; at: string }>;

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [at, uploadedBy, sizeRaw, name, url] = line.split('|');
      return {
        at: at || '',
        uploadedBy: uploadedBy || 'admin',
        size: Number(sizeRaw || 0),
        name: name || 'soubor',
        url: url || '',
      };
    })
    .filter((doc) => Boolean(doc.url));
}

function mapCase(page: any) {
  const notesRaw = readRichTextProperty(page, 'InternalNotes');
  const documentsRaw = readRichTextProperty(page, 'Documents');
  const activityRaw = readRichTextProperty(page, 'ActivityLog');

  return {
    id: page.id as string,
    url: page.url as string,
    createdTime: page.created_time as string,
    updatedTime: page.last_edited_time as string,
    name: readRichTextProperty(page, 'Name'),
    caseNumber: readRichTextProperty(page, 'CaseNumber'),
    fullName: readRichTextProperty(page, 'FullName'),
    email: readEmailProperty(page, 'Email'),
    phone: readRichTextProperty(page, 'Phone'),
    insuranceType: readRichTextProperty(page, 'InsuranceType'),
    insuranceCompany: readRichTextProperty(page, 'InsuranceCompany'),
    incidentDate: readDateProperty(page, 'IncidentDate'),
    incidentLocation: readRichTextProperty(page, 'IncidentLocation'),
    incidentDescription: readRichTextProperty(page, 'IncidentDescription'),
    claimAmount: readNumberProperty(page, 'ClaimAmount'),
    status: readSelectProperty(page, 'Status'),
    source: readSelectProperty(page, 'Source'),
    priority: readSelectProperty(page, 'Priority'),
    assignee: readRichTextProperty(page, 'Assignee'),
    lastStatusChangeAt: readDateProperty(page, 'LastStatusChangeAt'),
    lastStatusChangeBy: readRichTextProperty(page, 'LastStatusChangeBy'),
    notesRaw,
    notes: parseLogLines(notesRaw),
    documentsRaw,
    documents: parseDocuments(documentsRaw),
    activityRaw,
    activity: parseLogLines(activityRaw),
  };
}

async function patchNotionPageProperties(pageId: string, properties: Record<string, unknown>) {
  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({ properties }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion page patch failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchNotionPageRaw(pageId: string) {
  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: 'GET',
    headers: notionHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion get case failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function appendLogPropertyLine(pageId: string, property: 'InternalNotes' | 'ActivityLog' | 'Documents', line: string, maxChars = 1900) {
  const raw = await fetchNotionPageRaw(pageId);
  const current = readRichTextProperty(raw, property);
  const next = `${normalizeLine(line)}\n${current}`.slice(0, maxChars);
  await patchNotionPageProperties(pageId, {
    [property]: { rich_text: toRichText(next) },
  });
}

export async function ensureNotionCaseSchema() {
  if (schemaEnsurePromise) {
    return schemaEnsurePromise;
  }

  schemaEnsurePromise = (async () => {
    const dbId = getCasesDbId();
    const res = await fetch(`${NOTION_API_BASE}/databases/${dbId}`, {
      method: 'GET',
      headers: notionHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion get database failed: ${res.status} ${text}`);
    }

    const db = await res.json();
    const props = db.properties || {};
    const missing: Record<string, any> = {};

    if (!props.Priority) {
      missing.Priority = {
        select: {
          options: [
            { name: 'low', color: 'gray' },
            { name: 'medium', color: 'yellow' },
            { name: 'high', color: 'orange' },
            { name: 'urgent', color: 'red' },
          ],
        },
      };
    }

    if (!props.Assignee) missing.Assignee = { rich_text: {} };
    if (!props.InternalNotes) missing.InternalNotes = { rich_text: {} };
    if (!props.ActivityLog) missing.ActivityLog = { rich_text: {} };
    if (!props.Documents) missing.Documents = { rich_text: {} };
    if (!props.LastStatusChangeAt) missing.LastStatusChangeAt = { date: {} };
    if (!props.LastStatusChangeBy) missing.LastStatusChangeBy = { rich_text: {} };

    if (Object.keys(missing).length > 0) {
      const patchRes = await fetch(`${NOTION_API_BASE}/databases/${dbId}`, {
        method: 'PATCH',
        headers: notionHeaders(),
        body: JSON.stringify({ properties: missing }),
        cache: 'no-store',
      });

      if (!patchRes.ok) {
        const text = await patchRes.text();
        throw new Error(`Notion schema patch failed: ${patchRes.status} ${text}`);
      }
    }
  })();

  return schemaEnsurePromise;
}

export async function createNotionCase(input: PublicCaseInput) {
  await ensureNotionCaseSchema();

  const dbId = getCasesDbId();
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
      Priority: { select: { name: 'medium' } },
      Assignee: { rich_text: toRichText('') },
      InternalNotes: { rich_text: toRichText('') },
      ActivityLog: { rich_text: toRichText('') },
      Documents: { rich_text: toRichText('') },
      LastStatusChangeAt: { date: { start: new Date().toISOString() } },
      LastStatusChangeBy: { rich_text: toRichText('system') },
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
  await appendLogPropertyLine(
    data.id,
    'ActivityLog',
    `${new Date().toISOString()}|created|system|Případ založen přes web`,
  );

  return {
    id: data.id as string,
    url: data.url as string,
    caseNumber,
  };
}

export async function listNotionCases(limit = 20) {
  await ensureNotionCaseSchema();

  const dbId = getCasesDbId();

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
  return (data.results || []).map((item: any) => mapCase(item));
}

export async function listNotionCasesForAdmin(limit = 100, status?: string, q?: string, priority?: string) {
  await ensureNotionCaseSchema();

  const dbId = getCasesDbId();

  const body: any = {
    page_size: limit,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  };

  if (status && NOTION_CASE_STATUSES.includes(status as NotionCaseStatus)) {
    body.filter = {
      property: 'Status',
      select: { equals: status },
    };
  }

  const response = await fetch(`${NOTION_API_BASE}/databases/${dbId}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion list admin cases failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  let items = (data.results || []).map((item: any) => mapCase(item));

  if (priority && NOTION_CASE_PRIORITIES.includes(priority as NotionCasePriority)) {
    items = items.filter((item: any) => item.priority === priority);
  }

  if (q && q.trim()) {
    const query = q.toLowerCase();
    items = items.filter((item: any) => {
      return (
        item.caseNumber?.toLowerCase().includes(query) ||
        item.fullName?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.incidentDescription?.toLowerCase().includes(query)
      );
    });
  }

  return items;
}

export async function getNotionCaseById(pageId: string) {
  await ensureNotionCaseSchema();
  const data = await fetchNotionPageRaw(pageId);
  return mapCase(data);
}

export async function updateNotionCaseStatus(pageId: string, status: NotionCaseStatus, actor = 'admin') {
  await ensureNotionCaseSchema();

  if (!NOTION_CASE_STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }

  const data = await patchNotionPageProperties(pageId, {
    Status: { select: { name: status } },
    LastStatusChangeAt: { date: { start: new Date().toISOString() } },
    LastStatusChangeBy: { rich_text: toRichText(actor) },
  });

  await appendLogPropertyLine(
    pageId,
    'ActivityLog',
    `${new Date().toISOString()}|status|${actor}|Status změněn na ${status}`,
  );

  return mapCase(data);
}

export async function updateNotionCaseAssignment(pageId: string, assignee: string, actor = 'admin') {
  await ensureNotionCaseSchema();

  const cleanAssignee = normalizeLine(assignee || '');
  const data = await patchNotionPageProperties(pageId, {
    Assignee: { rich_text: toRichText(cleanAssignee) },
  });

  await appendLogPropertyLine(
    pageId,
    'ActivityLog',
    `${new Date().toISOString()}|assign|${actor}|Přiřazeno: ${cleanAssignee || 'bez přiřazení'}`,
  );

  return mapCase(data);
}

export async function updateNotionCasePriority(pageId: string, priority: NotionCasePriority, actor = 'admin') {
  await ensureNotionCaseSchema();

  if (!NOTION_CASE_PRIORITIES.includes(priority)) {
    throw new Error('Invalid priority');
  }

  const data = await patchNotionPageProperties(pageId, {
    Priority: { select: { name: priority } },
  });

  await appendLogPropertyLine(
    pageId,
    'ActivityLog',
    `${new Date().toISOString()}|priority|${actor}|Priorita změněna na ${priority}`,
  );

  return mapCase(data);
}

export async function addNotionCaseNote(pageId: string, note: string, actor = 'admin') {
  await ensureNotionCaseSchema();

  const content = sanitizeMultiline(note);
  if (!content) {
    throw new Error('Note is empty');
  }

  await appendLogPropertyLine(
    pageId,
    'InternalNotes',
    `${new Date().toISOString()}|note|${actor}|${content}`,
  );

  await appendLogPropertyLine(
    pageId,
    'ActivityLog',
    `${new Date().toISOString()}|note|${actor}|Přidána interní poznámka`,
  );

  return getNotionCaseById(pageId);
}

export async function listNotionCaseNotes(pageId: string) {
  const item = await getNotionCaseById(pageId);
  return item.notes || [];
}

export async function addNotionCaseDocument(
  pageId: string,
  input: { name: string; url: string; size?: number; uploadedBy?: string },
) {
  await ensureNotionCaseSchema();

  const line = `${new Date().toISOString()}|${normalizeLine(input.uploadedBy || 'admin')}|${
    input.size || 0
  }|${normalizeLine(input.name)}|${normalizeLine(input.url)}`;

  await appendLogPropertyLine(pageId, 'Documents', line);
  await appendLogPropertyLine(
    pageId,
    'ActivityLog',
    `${new Date().toISOString()}|document|${normalizeLine(input.uploadedBy || 'admin')}|Nahrán dokument ${normalizeLine(
      input.name,
    )}`,
  );

  return getNotionCaseById(pageId);
}

export async function listNotionCaseDocuments(pageId: string) {
  const item = await getNotionCaseById(pageId);
  return item.documents || [];
}

export async function listNotionCaseActivity(pageId: string) {
  const item = await getNotionCaseById(pageId);
  return item.activity || [];
}

export async function getNotionCaseAnalytics() {
  const items = await listNotionCasesForAdmin(200);
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let totalAmount = 0;

  for (const item of items as any[]) {
    const status = item.status || 'unknown';
    const priority = item.priority || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
    byPriority[priority] = (byPriority[priority] || 0) + 1;
    totalAmount += Number(item.claimAmount || 0);
  }

  return {
    totalCases: items.length,
    totalAmount,
    byStatus,
    byPriority,
    recent: items.slice(0, 10),
  };
}
