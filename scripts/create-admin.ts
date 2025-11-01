#!/usr/bin/env tsx
/**
 * Script pro vytvoření prvního admin uživatele
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts admin@claimbuddy.cz "Admin User"
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';

async function createAdminUser(email: string, displayName: string) {
  try {
    console.log(`🔧 Vytvářím admin uživatele: ${email}`);

    // 1. Vytvoř uživatele v Firebase Auth
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
      console.log(`✅ Uživatel již existuje v Auth: ${user.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        user = await adminAuth.createUser({
          email,
          displayName,
          password: 'Admin123!', // Doporučuji změnit při prvním přihlášení
          emailVerified: true,
        });
        console.log(`✅ Vytvořen nový uživatel v Auth: ${user.uid}`);
      } else {
        throw error;
      }
    }

    // 2. Vytvoř/aktualizuj záznam v Firestore
    const userData = {
      email: user.email || email,
      displayName: displayName,
      role: 'admin' as const,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Admin stats
      caseCount: 0,
      resolvedCount: 0,
    };

    await adminDb.collection('users').doc(user.uid).set(userData, { merge: true });
    console.log(`✅ Uživatel uložen do Firestore s role: admin`);

    console.log('\n✨ HOTOVO!');
    console.log('---');
    console.log(`Email: ${email}`);
    console.log(`Heslo: Admin123! (ZMĚŇ PŘI PRVNÍM PŘIHLÁŠENÍ!)`);
    console.log(`Role: admin`);
    console.log(`UID: ${user.uid}`);
    console.log('---');
    console.log('\n🔐 Přihlas se na: http://localhost:3000/login');

  } catch (error: any) {
    console.error('❌ Chyba při vytváření admin uživatele:', error.message);
    process.exit(1);
  }
}

// Parse arguments
const email = process.argv[2];
const displayName = process.argv[3] || 'Admin User';

if (!email) {
  console.error('❌ Chybí email!');
  console.log('\nUsage:');
  console.log('  npx tsx scripts/create-admin.ts admin@claimbuddy.cz "Admin User"');
  process.exit(1);
}

// Run
createAdminUser(email, displayName)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
