#!/usr/bin/env tsx
/**
 * Script pro generování fiktivních dat pro testování
 *
 * Vytvoří:
 * - 1 admin účet (radim@wikiporadce.cz)
 * - 3 agenty
 * - 10 klientů
 * - 25 případů (různé statusy)
 * - Zprávy a dokumenty pro každý případ
 *
 * Usage:
 *   npx tsx scripts/seed-data.ts
 */

// ⚠️ DŮLEŽITÉ: Musí být PŘED všemi ostatními importy!
import { config } from 'dotenv';
config({ path: '.env.local' });

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin manually
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Chybí Firebase credentials v .env.local!');
    console.error('   Zkontroluj že .env.local obsahuje:');
    console.error('   - FIREBASE_PROJECT_ID');
    console.error('   - FIREBASE_CLIENT_EMAIL');
    console.error('   - FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  console.log(`✅ Firebase Admin initialized (${projectId})\n`);
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

// Česká jména a příjmení
const firstNames = ['Jan', 'Petr', 'Pavel', 'Martin', 'Tomáš', 'Jana', 'Eva', 'Anna', 'Lenka', 'Petra'];
const lastNames = ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházková', 'Kučerová', 'Veselá', 'Horáková', 'Němcová'];

const insuranceCompanies = [
  'Česká pojišťovna',
  'Kooperativa',
  'Allianz pojišťovna',
  'Generali Česká pojišťovna',
  'ČSOB Pojišťovna',
  'Uniqa pojišťovna',
  'Direct pojišťovna',
];

const caseStatuses = ['new', 'in_progress', 'waiting_for_info', 'resolved', 'rejected'] as const;

const incidentTypes = [
  'Dopravní nehoda',
  'Pracovní úraz',
  'Úraz při sportu',
  'Poškození majetku',
  'Nemoc z povolání',
];

// Generuj náhodné datum v posledních 90 dnech
function randomDate(daysBack: number = 90): Date {
  const now = Date.now();
  const randomMs = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - randomMs);
}

// Generuj náhodnou částku 5,000 - 500,000 Kč
function randomAmount(): number {
  return Math.floor(Math.random() * 495000) + 5000;
}

// Generuj náhodné jméno
function randomName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

// Generuj email z jména
function emailFromName(name: string, suffix: string = 'test'): string {
  return name.toLowerCase().replace(' ', '.') + `@${suffix}.cz`;
}

async function createUser(email: string, displayName: string, role: 'client' | 'agent' | 'admin', password: string = 'Test123!') {
  try {
    // Zkontroluj jestli už existuje
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
      console.log(`   ℹ️  User ${email} již existuje (UID: ${user.uid})`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Vytvoř nového
        user = await adminAuth.createUser({
          email,
          displayName,
          password,
          emailVerified: true,
        });
        console.log(`   ✅ Vytvořen user ${email} (UID: ${user.uid})`);
      } else {
        throw error;
      }
    }

    // Ulož do Firestore
    await adminDb.collection('users').doc(user.uid).set({
      email: user.email || email,
      displayName,
      role,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      caseCount: 0,
      resolvedCount: 0,
    }, { merge: true });

    return user.uid;
  } catch (error: any) {
    console.error(`   ❌ Chyba při vytváření ${email}:`, error.message);
    throw error;
  }
}

async function createCase(
  userId: string,
  assignedTo: string | null,
  status: typeof caseStatuses[number],
  daysAgo: number
) {
  const createdAt = randomDate(daysAgo);
  const caseNumber = `CB-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const caseData = {
    userId,
    caseNumber,
    status,
    assignedTo,

    // Detaily
    insuranceCompany: insuranceCompanies[Math.floor(Math.random() * insuranceCompanies.length)],
    incidentType: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
    claimAmount: randomAmount(),
    incidentDate: randomDate(daysAgo + 30),
    description: 'Testovací případ vytvořený automaticky pro demo účely.',

    // Metadata
    createdAt,
    updatedAt: createdAt,
    documentCount: Math.floor(Math.random() * 5) + 1,
    messageCount: Math.floor(Math.random() * 10) + 2,
  };

  const caseRef = await adminDb.collection('cases').add(caseData);

  // Přidej timeline event
  await adminDb.collection('timeline').add({
    caseId: caseRef.id,
    type: 'status_change',
    status: 'new',
    createdAt,
    userId,
    description: 'Případ vytvořen',
  });

  // Pokud má status jiný než 'new', přidej další události
  if (status !== 'new') {
    await adminDb.collection('timeline').add({
      caseId: caseRef.id,
      type: 'status_change',
      status,
      createdAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 den
      userId: assignedTo || userId,
      description: `Status změněn na: ${status}`,
    });
  }

  // Přidej zprávu
  await adminDb.collection('cases').doc(caseRef.id).collection('messages').add({
    userId,
    content: 'Dobrý den, rád bych nahlásil pojistnou událost.',
    type: 'user',
    createdAt,
  });

  if (assignedTo) {
    await adminDb.collection('cases').doc(caseRef.id).collection('messages').add({
      userId: assignedTo,
      content: 'Dobrý den, váš případ jsme přijali ke zpracování. Budeme vás kontaktovat.',
      type: 'agent',
      createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000), // +2 hodiny
    });
  }

  return caseRef.id;
}

async function seedData() {
  console.log('🌱 Generuji testovací data...\n');

  try {
    // 1. ADMIN (radim@wikiporadce.cz)
    console.log('👤 Vytvářím admin účet...');
    const adminId = await createUser(
      'radim@wikiporadce.cz',
      'Radim (Admin)',
      'admin',
      'Zajda910524'
    );
    console.log('');

    // 2. AGENTI (3x)
    console.log('👥 Vytvářím agenty...');
    const agent1 = await createUser('agent1@claimbuddy.cz', 'Lucie Svobodová', 'agent');
    const agent2 = await createUser('agent2@claimbuddy.cz', 'Petr Novák', 'agent');
    const agent3 = await createUser('agent3@claimbuddy.cz', 'Jana Dvořáková', 'agent');
    const agents = [agent1, agent2, agent3];
    console.log('');

    // 3. KLIENTI (10x)
    console.log('👨‍👩‍👧‍👦 Vytvářím klienty...');
    const clients: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = randomName();
      const email = emailFromName(name, 'client');
      const clientId = await createUser(email, name, 'client');
      clients.push(clientId);
    }
    console.log('');

    // 4. PŘÍPADY (25x)
    console.log('📋 Vytvářím případy...');
    let caseCount = 0;

    // 5 nových případů (nepřiřazeno)
    for (let i = 0; i < 5; i++) {
      await createCase(
        clients[Math.floor(Math.random() * clients.length)],
        null,
        'new',
        Math.floor(Math.random() * 7) // 0-7 dní zpět
      );
      caseCount++;
      console.log(`   ✅ Případ ${caseCount}/25 (new, nepřiřazeno)`);
    }

    // 8 in_progress případů
    for (let i = 0; i < 8; i++) {
      await createCase(
        clients[Math.floor(Math.random() * clients.length)],
        agents[Math.floor(Math.random() * agents.length)],
        'in_progress',
        Math.floor(Math.random() * 30) + 7 // 7-37 dní zpět
      );
      caseCount++;
      console.log(`   ✅ Případ ${caseCount}/25 (in_progress)`);
    }

    // 4 waiting_for_info případů
    for (let i = 0; i < 4; i++) {
      await createCase(
        clients[Math.floor(Math.random() * clients.length)],
        agents[Math.floor(Math.random() * agents.length)],
        'waiting_for_info',
        Math.floor(Math.random() * 20) + 10 // 10-30 dní zpět
      );
      caseCount++;
      console.log(`   ✅ Případ ${caseCount}/25 (waiting_for_info)`);
    }

    // 6 resolved případů
    for (let i = 0; i < 6; i++) {
      await createCase(
        clients[Math.floor(Math.random() * clients.length)],
        agents[Math.floor(Math.random() * agents.length)],
        'resolved',
        Math.floor(Math.random() * 60) + 30 // 30-90 dní zpět
      );
      caseCount++;
      console.log(`   ✅ Případ ${caseCount}/25 (resolved)`);
    }

    // 2 rejected případy
    for (let i = 0; i < 2; i++) {
      await createCase(
        clients[Math.floor(Math.random() * clients.length)],
        agents[Math.floor(Math.random() * agents.length)],
        'rejected',
        Math.floor(Math.random() * 30) + 20 // 20-50 dní zpět
      );
      caseCount++;
      console.log(`   ✅ Případ ${caseCount}/25 (rejected)`);
    }

    console.log('\n✨ HOTOVO!\n');
    console.log('📊 Shrnutí:');
    console.log('   • 1 admin (radim@wikiporadce.cz / Zajda910524)');
    console.log('   • 3 agenti (agent1-3@claimbuddy.cz / Test123!)');
    console.log('   • 10 klientů (*.klient@client.cz / Test123!)');
    console.log('   • 25 případů (různé statusy)');
    console.log('');
    console.log('🔐 Admin přihlášení:');
    console.log('   Email: radim@wikiporadce.cz');
    console.log('   Heslo: Zajda910524');
    console.log('   URL: http://localhost:3000/login');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Chyba při generování dat:', error.message);
    process.exit(1);
  }
}

// Run
seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
