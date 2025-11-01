import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './client';
import { nanoid } from 'nanoid';
import type { Case, Message, Payment, CaseTimeline, Notification } from '@/types';
import { CASE_STATUSES } from '@/lib/constants';

// Helper function pro konverzi Firestore timestampů
function convertTimestamps(data: DocumentData): any {
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
}

// Cases
export async function createCase(userId: string, caseData: Partial<Case>) {
  try {
    const caseNumber = `CB-${Date.now()}-${nanoid(6).toUpperCase()}`;

    const newCase = {
      ...caseData,
      userId,
      caseNumber,
      status: CASE_STATUSES.NEW,
      documents: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'cases'), newCase);

    // Vytvoř timeline entry
    await addTimelineEntry(docRef.id, {
      type: 'status_change',
      title: 'Případ vytvořen',
      description: 'Nový případ byl úspěšně vytvořen',
      userId,
    });

    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
}

export async function getCase(caseId: string): Promise<Case | null> {
  try {
    const caseDoc = await getDoc(doc(db, 'cases', caseId));
    if (caseDoc.exists()) {
      return { id: caseDoc.id, ...convertTimestamps(caseDoc.data()) } as Case;
    }
    return null;
  } catch (error) {
    console.error('Error fetching case:', error);
    return null;
  }
}

export async function getCases(
  userId: string,
  options?: {
    limitCount?: number;
    lastDoc?: QueryDocumentSnapshot;
    status?: string;
  }
) {
  try {
    let q = query(
      collection(db, 'cases'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    if (options?.lastDoc) {
      q = query(q, startAfter(options.lastDoc));
    }

    const snapshot = await getDocs(q);
    const cases = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Case[];

    return { cases, lastDoc: snapshot.docs[snapshot.docs.length - 1], error: null };
  } catch (error: any) {
    return { cases: [], lastDoc: null, error: error.message };
  }
}

export async function getAllCases(options?: { limitCount?: number; status?: string }) {
  try {
    let q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    const cases = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Case[];

    return { cases, error: null };
  } catch (error: any) {
    return { cases: [], error: error.message };
  }
}

export async function updateCase(caseId: string, updates: Partial<Case>) {
  try {
    await updateDoc(doc(db, 'cases', caseId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Pokud se změnil status, přidej timeline entry
    if (updates.status) {
      await addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Status aktualizován',
        description: `Status změněn na: ${updates.status}`,
      });
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCase(caseId: string) {
  try {
    // Smaž všechny related dokumenty
    const batch = writeBatch(db);

    // Smaž messages
    const messagesSnapshot = await getDocs(
      query(collection(db, 'messages'), where('caseId', '==', caseId))
    );
    messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    // Smaž timeline
    const timelineSnapshot = await getDocs(
      query(collection(db, 'timeline'), where('caseId', '==', caseId))
    );
    timelineSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    // Smaž case
    batch.delete(doc(db, 'cases', caseId));

    await batch.commit();
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Messages
export async function sendMessage(
  caseId: string,
  userId: string,
  userName: string,
  userRole: string,
  content: string,
  attachments?: string[]
) {
  try {
    const message = {
      caseId,
      userId,
      userName,
      userRole,
      type: userRole === 'client' ? 'client' : 'admin',
      content,
      attachments: attachments || [],
      read: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'messages'), message);

    // Přidej timeline entry
    await addTimelineEntry(caseId, {
      type: 'message',
      title: 'Nová zpráva',
      description: content.substring(0, 100),
      userId,
      userName,
    });

    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
}

export async function getMessages(caseId: string) {
  try {
    const q = query(
      collection(db, 'messages'),
      where('caseId', '==', caseId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Message[];

    return { messages, error: null };
  } catch (error: any) {
    return { messages: [], error: error.message };
  }
}

export function subscribeToMessages(caseId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, 'messages'),
    where('caseId', '==', caseId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Message[];
    callback(messages);
  });
}

export async function markMessageAsRead(messageId: string) {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: true,
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Timeline
export async function addTimelineEntry(
  caseId: string,
  entry: Omit<CaseTimeline, 'id' | 'caseId' | 'createdAt'>
) {
  try {
    await addDoc(collection(db, 'timeline'), {
      caseId,
      ...entry,
      createdAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getTimeline(caseId: string) {
  try {
    const q = query(
      collection(db, 'timeline'),
      where('caseId', '==', caseId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const timeline = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as CaseTimeline[];

    return { timeline, error: null };
  } catch (error: any) {
    return { timeline: [], error: error.message };
  }
}

// Payments
export async function createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
}

export async function updatePayment(paymentId: string, updates: Partial<Payment>) {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Notifications
export async function createNotification(
  notification: Omit<Notification, 'id' | 'createdAt'>
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getNotifications(userId: string) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Notification[];

    return { notifications, error: null };
  } catch (error: any) {
    return { notifications: [], error: error.message };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
